const script = document.createElement("script");
script.src = chrome.runtime.getURL("inject.js");
script.onload = () => script.remove();
(document.head || document.documentElement).appendChild(script);

window.addEventListener("message", (event) => {
  if (event.data?.type !== "LEETCODE_SUBMISSION_ID") return;

  const submissionId = event.data.submissionId;
  if (!submissionId) {
    console.warn("No submission ID received, skipping poll.");
    return;
  }

  pollSubmissionResult(submissionId);
});

function getCsrfToken() {
  return document.cookie
    .split(";")
    .find(row => row.trim().startsWith("csrftoken="))
    ?.split("=")[1];
}

async function pollSubmissionResult(submissionId) {
  const url = "https://leetcode.com/graphql";
  const csrftoken = getCsrfToken();

  if (!csrftoken) {
    console.error("No CSRF token found, cannot poll submission.");
    return;
  }

  console.log(`📡 Start polling submission ${submissionId}...`);

  while (true) {
    try {
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-csrftoken": csrftoken,
          "Referer": window.location.href,
        },
        body: JSON.stringify({
          operationName: "submissionDetail",
          query: `
            query submissionDetail($submissionId: ID!) {
              submissionDetail(submissionId: $submissionId) {
                id
                status
                statusDisplay
                lang
                memory
                runtime
                runtimePercentile
                memoryPercentile
                code
                timestamp
                question { questionFrontendId }
              }
            }
          `,
          variables: { submissionId: submissionId.toString() },
        }),
      });

      if (!res.ok) {
        console.warn(`Polling HTTP error: ${res.status}. Will retry if submission is valid.`);
        await sleep(1500);
        continue;
      }

      const data = await res.json();
      const submission = data.data?.submissionDetail;

      if (!submission) {
        console.warn("Submission not found yet. Retrying...");
        await sleep(1000);
        continue;
      }

      if (submission.status === "PENDING") {
        await sleep(1000);
        continue;
      }

      const title = document.querySelector('meta[property="og:title"]')?.content.replace(" - LeetCode", "") || "Unknown";
      const questionTitle = `${submission.question.questionFrontendId}. ${title}`;

      const lines = document.querySelectorAll(".view-line");
      const code = lines.length
        ? Array.from(lines).map(l => l.innerText).join("\n")
        : (submission.code || "");

      const runtimeMs = submission.runtime ? parseInt(submission.runtime) : null;
      const memoryKb = submission.memory ? Math.round(submission.memory / 1024) : null;

      const submissionData = {
        problemId: submission.question.questionFrontendId,
        title: questionTitle,
        status: submission.statusDisplay || submission.status,
        language: submission.lang,
        runtimeMs,
        runtimePercentile: submission.runtimePercentile || null,
        memoryKb,
        memoryPercentile: submission.memoryPercentile || null,
        code,
        submittedAt: submission.timestamp ? new Date(submission.timestamp * 1000).toISOString() : null,
      };

      console.log("✅ Submission captured:", submissionData);
      break;

    } catch (err) {
      console.error("Polling error:", err);
      await sleep(1500);
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

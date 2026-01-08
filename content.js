const script = document.createElement("script");
script.src = chrome.runtime.getURL("inject.js");
script.onload = () => script.remove();
(document.head || document.documentElement).appendChild(script);

window.addEventListener("message", (event) => {
  if (event.data?.type !== "LEETCODE_SUBMISSION_ID") return;

  const submissionId = event.data.submissionId;
  console.log("[content] Received submission ID:", submissionId);

  pollSubmissionResult(submissionId);
});

async function pollSubmissionResult(submissionId) {
  const checkUrl = `/submissions/detail/${submissionId}/check/`;
  console.log("[content] Polling:", checkUrl);

  while (true) {
    try {
      const res = await fetch(checkUrl, {
        credentials: "include",
      });

      const data = await res.json();
      console.log("[content] Poll response:", data);

      if (!data.finished) {
        await sleep(1000);
        continue;
      }

      const questionTitle = `${data.question_id}. ${
        document
          .querySelector('meta[property="og:title"]')
          ?.content.replace(" - LeetCode", "") || "Unknown"
      }`;

      const lines = document.querySelectorAll(".view-line");
      console.log("[content] Code lines found:", lines.length);

      const code = Array.from(lines)
        .map(line => line.innerText)
        .join("\n");

      const submissionData = {
        title: questionTitle,
        status: data.status_msg,
        language: data.pretty_lang,

        runtime: data.status_runtime,
        runtimePercentile: data.runtime_percentile,

        memory: data.status_memory,
        memoryPercentile: data.memory_percentile,

        code,
      };

      console.log("Submission captured:", submissionData);
      break;

    } catch (err) {
      console.error("[content] Poll error:", err);
      await sleep(1500);
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

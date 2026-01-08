console.log("[inject] inject.js loaded");

const originalFetch = window.fetch;

window.fetch = async function (...args) {
  const url = args[0];

  if (typeof url === "string" && url.includes("/submit/")) {
    console.log("[inject] submit detected");

    const res = await originalFetch.apply(this, args);

    try {
      const clone = res.clone();
      const data = await clone.json();

      if (data?.submission_id) {
        console.log("[inject] submit response:", data);

        window.postMessage(
          {
            type: "LEETCODE_SUBMISSION_ID",
            submissionId: data.submission_id,
          },
          "*"
        );
      }
    } catch (e) {}

    return res;
  }

  return originalFetch.apply(this, args);
};

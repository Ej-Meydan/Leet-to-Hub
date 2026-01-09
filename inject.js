(function() {
  
  const targetNode = document.querySelector("#__next"); 
  if (!targetNode) return;

  const config = { childList: true, subtree: true };

  const callback = (mutationsList) => {
    for (const mutation of mutationsList) {
      for (const node of mutation.addedNodes) {
        
        if (node.nodeType === 1) { 
          const submissionEl = node.querySelector("[data-cy='submission-status']");
          if (submissionEl) {

            const match = window.location.pathname.match(/submissions\/(\d+)/);
            if (match) {
              const submissionId = match[1];
              window.postMessage({
                type: "LEETCODE_SUBMISSION_ID",
                submissionId: submissionId
              }, "*");
            }
          }
        }
      }
    }
  };

  const observer = new MutationObserver(callback);
  observer.observe(targetNode, config);

})();

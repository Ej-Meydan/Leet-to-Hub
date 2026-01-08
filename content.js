let waitingForResult = false;

function submissionHandler(event) {
    const submitButton = event.target.closest(
        '[data-e2e-locator="console-submit-button"]'
    );

    const ctrlEnter = event.type === "keydown" && event.ctrlKey && event.key === "Enter";

    if (submitButton || ctrlEnter) {
        waitingForResult = true;
        console.log("SUBMISSION STARTED - waiting for result");
    }
}

document.addEventListener("click", submissionHandler);
document.addEventListener("keydown", submissionHandler);

const observer = new MutationObserver(() => {
    const result = document.querySelector(
        '[data-e2e-locator="submission-result"]'
    );

    if (!result) return;

    if (!waitingForResult) return;

    if (result.innerText.includes("Accepted")) {
        console.log("ACCEPTED DETECTED");
        
        waitingForResult = false;
        observer.disconnect();
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true 
});
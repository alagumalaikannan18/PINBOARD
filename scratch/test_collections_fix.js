// Pure Node test simulating DOM click bubbling and toggle state

console.log("=== TESTING DOUBLE TOGGLE ISSUE ===");

let overlayState = { open: false };

function openCollectionOverlay() {
  console.log("-> openCollectionOverlay called");
  overlayState.open = true;
}

function closeCollectionOverlay() {
  console.log("-> closeCollectionOverlay called");
  overlayState.open = false;
}

function toggleCollectionOverlay() {
  console.log("-> toggleCollectionOverlay called, current state:", overlayState.open);
  if (overlayState.open) {
    closeCollectionOverlay();
  } else {
    openCollectionOverlay();
  }
}

// SIMULATION 1: Without stopPropagation() (CURRENT BROKEN BEHAVIOR)
console.log("\n--- SIMULATION 1: Current code without stopPropagation() ---");
overlayState.open = false; // Initial state: closed

function scriptJsElementHandler(evt) {
  console.log("[script.js element listener] Handling click");
  evt.preventDefault();
  toggleCollectionOverlay();
}

function navigationJsDocumentHandler(evt) {
  if (evt.stopped) return;
  console.log("[navigation.js document listener] Handling click");
  evt.preventDefault();
  toggleCollectionOverlay();
}

let mockEvt1 = {
  defaultPrevented: false,
  stopped: false,
  preventDefault: function() { this.defaultPrevented = true; },
  stopPropagation: function() { this.stopped = true; }
};

// 1. Element listener fires
scriptJsElementHandler(mockEvt1);
// 2. Event bubbles to document listener
navigationJsDocumentHandler(mockEvt1);

console.log("Final overlay state (SIMULATION 1):", overlayState.open ? "OPEN" : "CLOSED (BUG!)");


// SIMULATION 2: With stopPropagation() (FIXED BEHAVIOR)
console.log("\n--- SIMULATION 2: Fixed code with stopPropagation() ---");
overlayState.open = false; // Initial state: closed

let mockEvt2 = {
  defaultPrevented: false,
  stopped: false,
  preventDefault: function() { this.defaultPrevented = true; },
  stopPropagation: function() { this.stopped = true; }
};

function scriptJsElementHandlerFixed(evt) {
  console.log("[script.js element listener] Handling click with stopPropagation()");
  evt.preventDefault();
  evt.stopPropagation();
  toggleCollectionOverlay();
}

// 1. Element listener fires
scriptJsElementHandlerFixed(mockEvt2);
// 2. Event bubbles to document listener
navigationJsDocumentHandler(mockEvt2);

console.log("Final overlay state (SIMULATION 2):", overlayState.open ? "OPEN (SUCCESS!)" : "CLOSED");

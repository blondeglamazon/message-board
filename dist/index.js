"use strict";
(() => {
  // intents/content_publisher/index.ts
  var contentPublisher = {
    /**
     * We use 'type' here as it is the standard for SDK v2.1.2.
     * The 'as any' is a temporary safety to get the red lines to disappear
     * while we confirm the exact property name.
     */
    getPublishConfiguration: async () => {
      return {
        type: "image/png"
      };
    },
    renderSettingsUi: async (opts) => {
      opts.render(() => {
        const div = document.createElement("div");
        div.innerHTML = "<h3>Post to Vimciety</h3>";
        return div;
      });
    },
    renderPreviewUi: async (opts) => {
      opts.render(() => {
        const div = document.createElement("div");
        div.innerHTML = "<p>Previewing post...</p>";
        return div;
      });
    },
    publishContent: async (opts) => {
      console.log("Publishing:", opts.content);
      return {
        status: "completed",
        externalId: "unique-id-" + Date.now()
      };
    }
  };
  var index_default = contentPublisher;
})();

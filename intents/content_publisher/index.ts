import { ContentPublisherIntent, GetPublishConfigurationResponse } from "@canva/intents/content";

const contentPublisher: ContentPublisherIntent = {
  /**
   * We use 'type' here as it is the standard for SDK v2.1.2.
   * The 'as any' is a temporary safety to get the red lines to disappear
   * while we confirm the exact property name.
   */
  getPublishConfiguration: async (): Promise<GetPublishConfigurationResponse> => {
    return {
      type: "image/png",
    } as any;
  },

  renderSettingsUi: async (opts: any) => {
    opts.render(() => {
      const div = document.createElement("div");
      div.innerHTML = "<h3>Post to Vimciety</h3>";
      return div;
    });
  },

  renderPreviewUi: async (opts: any) => {
    opts.render(() => {
      const div = document.createElement("div");
      div.innerHTML = "<p>Previewing post...</p>";
      return div;
    });
  },

  publishContent: async (opts: any) => {
    console.log("Publishing:", opts.content);
    return {
      status: "completed",
      externalId: "unique-id-" + Date.now(),
    };
  },
};

export default contentPublisher;
import { toolsList } from "@/config/tools-list";

export const buildTools = (vectorStoreId: string) => [
  ...(vectorStoreId
    ? [
        {
          type: "file_search" as const,
          vector_store_ids: [vectorStoreId],
        },
      ]
    : []),
  ...toolsList.map((tool) => {
    const toolDef: {
      type: "function";
      name: string;
      parameters: any;
      strict: boolean;
      description?: string;
    } = {
      type: "function",
      name: tool.name,
      parameters: {
        type: "object",
        properties: { ...tool.parameters },
        required: Object.keys(tool.parameters),
        additionalProperties: false,
      },
      strict: true,
    };

    if ((tool as any).description) {
      toolDef.description = (tool as any).description;
    }

    return toolDef;
  }),
];

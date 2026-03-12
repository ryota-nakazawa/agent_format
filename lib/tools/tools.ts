import { toolsList } from "../../config/tools-list";
import { VECTOR_STORE_ID } from "@/config/constants";

const configuredVectorStoreId = String(VECTOR_STORE_ID).trim();
const hasConfiguredVectorStore =
  configuredVectorStoreId.length > 0 &&
  configuredVectorStoreId !== "<vector_store_id>";

export const tools = [
  ...(hasConfiguredVectorStore
    ? [
        {
          type: "file_search" as const,
          vector_store_ids: [configuredVectorStoreId],
        },
      ]
    : []),
  // Mapping toolsList into the expected tool definition format
  ...toolsList.map((tool) => {
    const toolDef: {
      type: string;
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

import { z } from "zod";
import prisma from "../db.js";

export function registerGetAttachmentText(server) {
  server.registerTool(
    "get_attachment_text",
    {
      title: "Get Attachment Text",
      description:
        "Retrieve parsed text content from an opportunity's PDF/DOCX attachments. Use with opportunityId to list available attachments, or with attachmentId to get the full parsed text of a specific document.",
      inputSchema: {
        opportunityId: z
          .string()
          .optional()
          .describe(
            "Opportunity ID — returns list of attachments with parse status"
          ),
        attachmentId: z
          .string()
          .optional()
          .describe(
            "Specific attachment ID — returns full parsed text"
          ),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ opportunityId, attachmentId }) => {
      try {
        if (!opportunityId && !attachmentId) {
          return {
            content: [
              {
                type: "text",
                text: "Please provide either an opportunityId (to list attachments) or an attachmentId (to get parsed text).",
              },
            ],
            isError: true,
          };
        }

        // Mode 1: List attachments for an opportunity
        if (opportunityId && !attachmentId) {
          const attachments =
            await prisma.opportunityAttachment.findMany({
              where: { opportunityId },
              select: {
                id: true,
                name: true,
                mimeType: true,
                size: true,
                postedDate: true,
                parsedAt: true,
              },
              orderBy: { attachmentOrder: "asc" },
            });

          if (attachments.length === 0) {
            return {
              content: [
                {
                  type: "text",
                  text: `No attachments found for opportunity "${opportunityId}".`,
                },
              ],
            };
          }

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    opportunityId,
                    attachmentCount: attachments.length,
                    attachments,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        // Mode 2: Get parsed text for a specific attachment
        const attachment =
          await prisma.opportunityAttachment.findUnique({
            where: { id: attachmentId },
            select: {
              id: true,
              name: true,
              mimeType: true,
              size: true,
              parsedText: true,
              parsedAt: true,
              opportunityId: true,
            },
          });

        if (!attachment) {
          return {
            content: [
              {
                type: "text",
                text: `No attachment found with id "${attachmentId}".`,
              },
            ],
            isError: true,
          };
        }

        if (!attachment.parsedAt || !attachment.parsedText) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    id: attachment.id,
                    name: attachment.name,
                    parsed: false,
                    message:
                      "This attachment has not been parsed yet. To make its content available for AI analysis, navigate to the opportunity detail page in the SupplyTiger dashboard and click 'Parse' on the attachment. Once parsed and saved, the content will be available here.",
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  id: attachment.id,
                  name: attachment.name,
                  mimeType: attachment.mimeType,
                  size: attachment.size,
                  parsedAt: attachment.parsedAt,
                  opportunityId: attachment.opportunityId,
                  parsedText: attachment.parsedText,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    }
  );
}

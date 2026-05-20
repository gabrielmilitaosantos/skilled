import { verifyWebhook } from "@clerk/tanstack-react-start/webhooks";
import { createFileRoute } from "@tanstack/react-router";
import { deleteUser } from "#/server/users/mutations/delete-user.ts";
import { syncUser } from "#/server/users/mutations/sync-user.ts";

export const Route = createFileRoute("/api/webhooks/clerk")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				try {
					// Check the webhook subscribe using CLERK_WEBHOOK_SIGNING_SECRET
					const evt = await verifyWebhook(request);

					if (evt.type === "user.created" || evt.type === "user.updated") {
						const { id, email_addresses, username, image_url } = evt.data;

						// Clerk can have multiple emails for one user.
						const primaryEmail = email_addresses.find(
							(e) => e.id === evt.data.primary_email_address_id,
						);
						if (!primaryEmail) {
							return new Response("No primary email found", { status: 400 });
						}

						const resolvedUsername =
							username ?? primaryEmail.email_address.split("@")[0];
						await syncUser({
							clerkId: id,
							email: primaryEmail.email_address,
							username: resolvedUsername,
							imageUrl: image_url ?? null,
						});
					}

					if (evt.type === "user.deleted") {
						const { id } = evt.data;

						if (!id) {
							return new Response("Missing user id", { status: 400 });
						}

						await deleteUser(id);
					}

					return new Response("Webhook received", { status: 200 });
				} catch (error) {
					console.error("Webhook error: ", error);
					return new Response("Error verifying webhook", { status: 400 });
				}
			},
		},
	},
});

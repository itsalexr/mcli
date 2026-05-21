import { Command } from 'commander';
import { GraphQLClient } from 'graphql-request';
import { z } from 'zod';
import chalk from 'chalk';
import { gqlRequest } from '../client';
import { printJson } from '../output';
import { CREATE_NOTIFICATION_MUTATION } from '../queries/notifications';

export interface CreateNotificationResult {
  create_notification: { text: string };
}

export async function createNotification(
  client: GraphQLClient,
  opts: { userId: string; targetId: string; text: string; targetType: string }
): Promise<CreateNotificationResult> {
  return gqlRequest<CreateNotificationResult>(client, CREATE_NOTIFICATION_MUTATION, {
    user_id: opts.userId,
    target_id: opts.targetId,
    text: opts.text,
    target_type: opts.targetType,
  });
}

const NotificationCreateOptionsSchema = z.object({
  user: z.string().min(1, 'User ID is required'),
  target: z.string().min(1, 'Target ID is required'),
  text: z.string().min(1, 'Text is required'),
  type: z.enum(['Post', 'Project'], { errorMap: () => ({ message: '--type must be Post or Project' }) }),
});

export function registerNotifications(program: Command, clientFactory: () => GraphQLClient): void {
  const notifications = program.command('notifications').description('Manage monday.com notifications');

  notifications
    .command('create')
    .description('Send a notification to a user')
    .requiredOption('--user <userId>', 'Recipient user ID')
    .requiredOption('--target <targetId>', 'Target entity ID (update/reply ID for Post; item/board ID for Project)')
    .requiredOption('--text <text>', 'Notification text')
    .requiredOption('--type <type>', 'Target type: Post (updates/replies) or Project (items/boards)')
    .action(async (opts: { user: string; target: string; text: string; type: string }) => {
      try {
        const validated = NotificationCreateOptionsSchema.parse(opts);
        const client = clientFactory();
        const result = await createNotification(client, {
          userId: validated.user,
          targetId: validated.target,
          text: validated.text,
          targetType: validated.type,
        });
        printJson({ sent: true, text: result.create_notification.text });
      } catch (err) {
        if (err instanceof z.ZodError) {
          console.error(chalk.red('Validation error: ' + err.issues.map((i) => i.message).join(', ')));
          process.exit(1);
        }
        console.error(chalk.red((err as Error).message));
        process.exit(1);
      }
    });
}

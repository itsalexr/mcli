import { createNotification } from '../src/commands/notifications';
import { createMockClient } from './helpers/mock-client';

const CREATE_NOTIFICATION_RESPONSE = {
  create_notification: { text: 'Hello!' },
};

describe('createNotification', () => {
  it('creates a notification and returns text', async () => {
    const mock = createMockClient();
    mock.setResponse(CREATE_NOTIFICATION_RESPONSE);
    const result = await createNotification(mock.client, {
      userId: '1',
      targetId: '100',
      text: 'Hello!',
      targetType: 'Project',
    });
    expect(result.create_notification.text).toBe('Hello!');
  });

  it('passes all variables correctly', async () => {
    const mock = createMockClient();
    mock.setResponse(CREATE_NOTIFICATION_RESPONSE);
    await createNotification(mock.client, {
      userId: '5',
      targetId: '200',
      text: 'Task done',
      targetType: 'Post',
    });
    const vars = mock.request.mock.calls[0][1] as Record<string, unknown>;
    expect(vars.user_id).toBe('5');
    expect(vars.target_id).toBe('200');
    expect(vars.text).toBe('Task done');
    expect(vars.target_type).toBe('Post');
  });

  it('propagates errors', async () => {
    const mock = createMockClient();
    mock.setError('Unauthorized');
    await expect(
      createNotification(mock.client, { userId: '1', targetId: '2', text: 'x', targetType: 'Project' })
    ).rejects.toThrow('Unauthorized');
  });
});

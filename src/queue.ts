import * as sqs from '@aws-sdk/client-sqs';

export interface Queue {
  push(message: string): Promise<void>;
  pop(): Promise<string | null>;
}

export class QueueSqs implements Queue {
  private readonly sqsClient: sqs.SQSClient;
  private readonly queueUrl: string;
  private inbox: string[];

  constructor(queueUrl: string) {
    this.sqsClient = new sqs.SQSClient({
      endpoint: process.env.AWS_ENDPOINT_URL,
    });
    this.queueUrl = queueUrl;
    this.inbox = [];
  }

  async push(message: string): Promise<void> {
    await this.sqsClient.send(
      new sqs.SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: message,
      }),
    );
  }

  private popInbox(): string | null {
    const result = this.inbox.splice(0, 1);
    if (result.length !== 1) {
      return null;
    }
    return result[0];
  }

  private async internalPop(): Promise<string | null> {
    if (this.inbox.length > 0) {
      return this.popInbox();
    }

    // Receive messages from SQS and place them in the inbox
    const result = await this.sqsClient.send(
      new sqs.ReceiveMessageCommand({
        QueueUrl: this.queueUrl,
        WaitTimeSeconds: 10,
      }),
    );
    if (!result.Messages || result.Messages.length === 0) {
      return null;
    }
    this.inbox = result.Messages.map((message) => message.Body as string);

    // Delete messages from SQS
    await Promise.all(
      result.Messages.map((message) =>
        this.sqsClient.send(
          new sqs.DeleteMessageCommand({
            QueueUrl: this.queueUrl,
            ReceiptHandle: message.ReceiptHandle,
          }),
        ),
      ),
    );

    return this.popInbox();
  }

  async pop(): Promise<string | null> {
    let retries = 0;

    while (retries < 18) {
      const message = await this.internalPop();
      if (message) {
        return message;
      }
      retries += 1;
    }

    return null;
  }
}

import async from 'async';
import { helloWorld } from '../functions/test';
import { QueueSqs } from '../src/queue';

export async function senderHandler(): Promise<void> {
  const queueUrl = process.env.QUEUE_URL;

  //get parameter store item locally and pass it to the lambda code
  const localParameterStoreItem = 'local-hello-world';

  const importedCode = helloWorld({ parameterStoreItem: localParameterStoreItem });

  const messages: string[] = ['message-1', importedCode];

  const sqsQueue = new QueueSqs(queueUrl || '');

  await async.eachSeries(messages, async (message: string) => {
    const queue = async.queue<{ message: string }>(async (event) => {
      await sqsQueue.push(JSON.stringify(event));
    });

    queue.push({ message });

    if (queue.length() > 0) {
      await queue.drain();
    }
  });
}

senderHandler()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

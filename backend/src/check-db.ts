import { prisma } from './config/database';

async function run() {
  console.log("Fetching conversations...");
  const convs = await prisma.chatConversation.findMany({
    orderBy: { updated_at: 'desc' },
    take: 3,
    include: {
      messages: {
        orderBy: { created_at: 'asc' },
      }
    }
  });

  for (const c of convs) {
    console.log(`\n====================================`);
    console.log(`Conversation ID: ${c.id}`);
    console.log(`Title: ${c.title}`);
    console.log(`Updated At: ${c.updated_at}`);
    console.log(`Messages Count: ${c.messages.length}`);
    for (const m of c.messages) {
      console.log(`  - Role: ${m.role}, ID: ${m.id}, CreatedAt: ${m.created_at}`);
      console.log(`    Content: "${m.content}"`);
      console.log(`    Attachments:`, m.attachments);
    }
  }
}

run().catch(console.error);

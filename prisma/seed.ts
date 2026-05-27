import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);
  const month = () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await db.message.deleteMany();
  await db.conversation.deleteMany();
  await db.tip.deleteMany();
  await db.subscription.deleteMany();
  await db.post.deleteMany();
  await db.session.deleteMany();
  await db.user.deleteMany();

  const carla = await db.user.create({
    data: {
      email: "carla@onlytacos.test",
      username: "carlaalpastor",
      displayName: "Carla al Pastor",
      passwordHash,
      bio: "Born in Mexico City. 3rd-gen taquera. Sharing pastor secrets one trompo at a time.",
      isCreator: true,
      monthlyPrice: 799,
    },
  });

  const diego = await db.user.create({
    data: {
      email: "diego@onlytacos.test",
      username: "diegosalsa",
      displayName: "Diego the Salsa Guy",
      passwordHash,
      bio: "Salsas, moles, and adobo pastes. Trained at Pujol. Now in your kitchen.",
      isCreator: true,
      monthlyPrice: 499,
    },
  });

  const fan = await db.user.create({
    data: {
      email: "fan@onlytacos.test",
      username: "tacofan",
      displayName: "Taco Fan",
      passwordHash,
      isCreator: false,
    },
  });

  await db.post.createMany({
    data: [
      {
        authorId: carla.id,
        title: "How to season your trompo",
        body: "The marinade is everything. Start with guajillos, achiote, pineapple juice, and a splash of vinegar. Marinate 24h minimum.",
        imageUrl: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800",
        isLocked: false,
      },
      {
        authorId: carla.id,
        title: "Secret family pineapple cut",
        body: "This is the cut my abuela taught me. It makes all the difference in caramelization. [Subscribers-only diagram inside.]",
        imageUrl: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800",
        isLocked: true,
      },
      {
        authorId: diego.id,
        title: "Salsa verde, the right way",
        body: "Roast the tomatillos. Don't boil them. Boiling is what tourists do. Roasting builds the smoke.",
        imageUrl: "https://images.unsplash.com/photo-1599909533730-2c2d8da7e3b8?w=800",
        isLocked: false,
      },
      {
        authorId: diego.id,
        title: "My base adobo recipe (full)",
        body: "Three kinds of chiles, one secret spice. Subscribers get the exact ratios and my source for the chiles.",
        isLocked: true,
      },
    ],
  });

  await db.subscription.create({
    data: {
      subscriberId: fan.id,
      creatorId: diego.id,
      expiresAt: month(),
    },
  });

  await db.tip.createMany({
    data: [
      { fromId: fan.id, toId: diego.id, amount: 500, message: "That salsa verde tutorial changed my life" },
      { fromId: fan.id, toId: carla.id, amount: 1000, message: "Saving up to fly to CDMX just to try your tacos" },
    ],
  });

  const pair =
    fan.id < diego.id
      ? { userAId: fan.id, userBId: diego.id }
      : { userAId: diego.id, userBId: fan.id };
  const convo = await db.conversation.create({
    data: pair,
  });
  await db.message.createMany({
    data: [
      { conversationId: convo.id, senderId: fan.id, body: "Quick question — what kind of vinegar do you use in the adobo?" },
      { conversationId: convo.id, senderId: diego.id, body: "Apple cider, always. Never white." },
    ],
  });

  console.log("Seeded:");
  console.log("  creator login: carla@onlytacos.test / password123");
  console.log("  creator login: diego@onlytacos.test / password123");
  console.log("  fan login:     fan@onlytacos.test / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

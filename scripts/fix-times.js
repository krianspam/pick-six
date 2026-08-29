const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const updates = [
    { id: "m_ned_swe", kickoff: "2026-06-20T22:30:00+05:30" },
    { id: "m_ger_civ", kickoff: "2026-06-21T01:30:00+05:30" },
    { id: "m_ecu_cuw", kickoff: "2026-06-21T05:30:00+05:30" },
    { id: "m_tun_jpn", kickoff: "2026-06-21T09:30:00+05:30" },
    { id: "m_esp_ksa", kickoff: "2026-06-21T21:30:00+05:30" },
    { id: "m_bel_irn", kickoff: "2026-06-22T00:30:00+05:30" },
    { id: "m_uru_cpv", kickoff: "2026-06-22T03:30:00+05:30" }
  ];

  for (const match of updates) {
    try {
      await prisma.match.update({
        where: { id: match.id },
        data: { kickoff: new Date(match.kickoff) }
      });
      console.log(`Updated ${match.id} to ${match.kickoff}`);
    } catch (e) {
      console.log(`Failed to update ${match.id}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

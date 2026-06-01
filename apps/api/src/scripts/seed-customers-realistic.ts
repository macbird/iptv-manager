import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seedRealisticCustomers() {
  const account = await prisma.account.findFirst();
  if (!account) {
    console.error('No account found');
    return;
  }

  const servers = await prisma.server.findMany();
  if (servers.length === 0) {
    console.error('No servers found');
    return;
  }

  const names = [
    'João Silva', 'Maria Oliveira', 'Carlos Santos', 'Ana Souza', 'Pedro Lima',
    'Fernanda Costa', 'Ricardo Pereira', 'Juliana Alves', 'Lucas Oliveira', 'Beatriz Rodrigues',
    'Rafael Carvalho', 'Camila Rocha', 'Thiago Almeida', 'Larissa Fernandes', 'Bruno Martins',
    'Mariana Ribeiro', 'Gabriel Barbosa', 'Amanda Pinto', 'Diego Cardoso', 'Patrícia Souza'
  ];

  for (const name of names) {
    await prisma.customer.create({
      data: {
        tenantId: account.id,
        name,
        phone: '(11) 99999-9999',
        status: 'active',
        connections: {
          create: [
            { 
              serverId: servers[0].id, 
              macAddress: 'AA:BB:CC:DD:EE:FF', 
              applicationName: 'Smarters Player',
              label: 'Principal'
            }
          ]
        }
      }
    });
  }

  console.log('Realistic customers seeded successfully');
}

seedRealisticCustomers().finally(() => prisma.$disconnect());

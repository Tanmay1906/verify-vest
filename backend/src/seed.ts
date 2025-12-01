import { prisma } from './shared/prisma.js';

async function main() {
  // Users
  const donor = await prisma.user.upsert({
    where: { email: 'donor@example.com' },
    update: {},
    create: { name: 'Tech for Good Foundation', email: 'donor@example.com', role: 'donor' },
  });
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: { name: 'Admin', email: 'admin@example.com', role: 'admin' },
  });
  const applicant = await prisma.user.upsert({
    where: { email: 'applicant@example.com' },
    update: {},
    create: { name: 'Jane Applicant', email: 'applicant@example.com', role: 'applicant' },
  });
  const verifier = await prisma.user.upsert({
    where: { email: 'verifier@example.com' },
    update: {},
    create: { name: 'Bob Verifier', email: 'verifier@example.com', role: 'verifier' },
  });

  // Grants
  const grant = await prisma.grant.create({
    data: {
      title: 'STEM Education for Underserved Communities',
      description: 'Supporting innovative STEM education programs that reach underserved communities and promote diversity in tech.',
      amount: 25000,
      category: 'Education',
      deadline: new Date('2025-12-31'),
      status: 'open',
      donorId: donor.id,
      donorName: donor.name,
      eligibility: ['Non-profit organizations', 'Educational institutions', 'Community leaders'],
      requirements: ['Detailed project plan', 'Budget breakdown', 'Community impact assessment'],
      milestonesCount: 3,
      applicantsCount: 0,
      fundsDistributed: 0,
    },
  });

  // Proposal with milestones
  const proposal = await prisma.proposal.create({
    data: {
      grantId: grant.id,
      applicantId: applicant.id,
      applicantName: applicant.name,
      title: 'Mobile STEM Labs for Rural Schools',
      description: 'Creating mobile STEM laboratories that travel to rural schools, bringing hands-on science education to 500+ students.',
      requestedAmount: 25000,
      status: 'approved',
      verifierId: verifier.id,
      milestones: {
        create: [
          {
            title: 'Equipment Procurement & Lab Setup',
            description: 'Purchase equipment and convert vehicle into mobile lab',
            amount: 10000,
            status: 'verified',
            dueDate: new Date('2025-11-15'),
            submittedAt: new Date('2025-11-10'),
            verifiedAt: new Date('2025-11-12'),
            verifierNotes: 'All equipment verified. Lab setup meets requirements.',
            evidence: 'Equipment receipts and photos submitted',
          },
          {
            title: 'Pilot Program - 5 Schools',
            description: 'Launch pilot program in 5 schools, gather feedback',
            amount: 8000,
            status: 'submitted',
            dueDate: new Date('2025-12-20'),
            submittedAt: new Date('2025-12-18'),
            evidence: 'Photos, attendance records, and student feedback forms',
          },
          {
            title: 'Full Program Rollout',
            description: 'Expand to 15 schools, complete curriculum',
            amount: 7000,
            status: 'pending',
            dueDate: new Date('2026-01-30'),
          },
        ],
      },
    },
    include: { milestones: true },
  });

  // eslint-disable-next-line no-console
  console.log('Seeded:', { users: [donor.email, applicant.email, verifier.email], grant: grant.title, proposal: proposal.title });
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

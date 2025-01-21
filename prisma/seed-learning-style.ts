import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createLearningStyleTest() {
  // First, create the base test
  const baseTest = await prisma.test.create({
    data: {
      title: 'Индивидуальный стиль обучения',
      description: 'Определение индивидуального стиля обучения студента',
      status: 'ACTIVE',
      author: {
        connect: {
          // You'll need to replace this with an actual admin user ID
          id: process.env.ADMIN_USER_ID
        }
      }
    }
  });

  // Create the learning style test
  const learningStyleTest = await prisma.learningStyleTest.create({
    data: {
      description: 'Цель: определение индивидуального стиля обучения, присущего студенту, проходящему диагностику по данной методике.',
      testId: baseTest.id
    }
  });

  // Questions and options data with unique scoring
  const questions = [
    {
      text: 'Специалист, к которому Вы, скорее всего, обратитесь за помощью – это человек…?',
      options: [
        { text: 'критически настроенный', column: 1, score: 2 },
        { text: 'слушающий и способный почувствовать чужие переживания', column: 2, score: 1 },
        { text: 'приглашающий к сотрудничеству', column: 3, score: 3 },
        { text: 'способный направить Ваши усилия на достижение успеха', column: 4, score: 4 }
      ]
    },
    {
      text: 'В процессе обучения в себе Вы больше всего цените?',
      options: [
        { text: 'восприимчивость', column: 1, score: 1 },
        { text: 'целеустремленность', column: 2, score: 3 },
        { text: 'способность к анализу', column: 3, score: 2 },
        { text: 'отсутствие предубеждений', column: 4, score: 4 }
      ]
    },
    {
      text: 'О себе Вы можете сказать, что Вы человек…',
      options: [
        { text: 'обучаемый', column: 1, score: 2 },
        { text: 'наблюдательный', column: 2, score: 3 },
        { text: 'мыслящий', column: 3, score: 1 },
        { text: 'действующий', column: 4, score: 4 }
      ]
    },
    {
      text: 'Когда Вам предлагают новый эффективный вариант решения проблемы, Вы чаще всего…?',
      options: [
        { text: 'доверяете советам опытных людей', column: 1, score: 1 },
        { text: 'рискуете попробовать', column: 2, score: 4 },
        { text: 'всесторонне оцениваете предложение', column: 3, score: 3 },
        { text: 'руководствуетесь своим первым ощущением', column: 4, score: 2 }
      ]
    },
    {
      text: 'При выборе пути решения профессиональных проблем Вы, прежде всего, руководствуетесь…?',
      options: [
        { text: 'интуицией', column: 1, score: 2 },
        { text: 'соображениями пользы', column: 2, score: 3 },
        { text: 'логикой', column: 3, score: 1 },
        { text: 'возможностью избегания неудачи', column: 4, score: 4 }
      ]
    },
    {
      text: 'В процессе обучения Вас больше всего интересует возможность…?',
      options: [
        { text: 'доверять обучающему', column: 1, score: 1 },
        { text: 'самостоятельно оценивать предложение', column: 2, score: 4 },
        { text: 'получать достоверную информацию', column: 3, score: 2 },
        { text: 'получать ответы на свои вопросы', column: 4, score: 3 }
      ]
    },
    {
      text: 'В обучении Вы больше всего ориентируетесь…?',
      options: [
        { text: 'на потребности сегодняшнего дня', column: 1, score: 2 },
        { text: 'на собственное восприятие ситуации', column: 2, score: 3 },
        { text: 'на запросы дня завтрашнего', column: 3, score: 1 },
        { text: 'на достижение практически-полезного результата', column: 4, score: 4 }
      ]
    },
    {
      text: 'Какие учебные пособия Вам более всего интересны…?',
      options: [
        { text: 'с описанием алгоритмов, методик (сценариев) действий', column: 1, score: 2 },
        { text: 'дающие материал для осмысления и определения собственной позиции', column: 2, score: 3 },
        { text: 'с хорошим теоретическим анализом и обоснованием', column: 3, score: 1 },
        { text: 'с наличием проблемных вопросов и ярких идей', column: 4, score: 4 }
      ]
    },
    {
      text: 'Как одним словом можно оценить Вашу деятельность в процессе обучения…?',
      options: [
        { text: 'усердие', column: 1, score: 2 },
        { text: 'сдержанность', column: 2, score: 1 },
        { text: 'разум', column: 3, score: 3 },
        { text: 'созидание', column: 4, score: 4 }
      ]
    }
  ];

  // Create questions and options
  for (let i = 0; i < questions.length; i++) {
    const question = await prisma.learningStyleQuestion.create({
      data: {
        text: questions[i].text,
        orderNumber: i + 1,
        test: {
          connect: {
            id: learningStyleTest.id
          }
        },
        options: {
          create: questions[i].options.map(option => ({
            text: option.text,
            column: option.column,
            score: option.score
          }))
        }
      }
    });
  }

  console.log('Learning Style Test seeded successfully');
}

async function main() {
  try {
    await createLearningStyleTest();
  } catch (error) {
    console.error('Error seeding learning style test:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();

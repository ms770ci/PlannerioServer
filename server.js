const express = require('express');
const api = express();
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
async function fetchUsers() {
  const users = await prisma.User.findMany();
  console.log('Users fetched via prisma: ', users);
}
//fetchUsers();
//const cors = require('cors');

const pool = new Pool({
  user: process.env.DATABASE_USER,
  host: process.env.DATABASE_HOST,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  port: process.env.DATABASE_PORT,
});

const corsOptions = {
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

const PORT = 8888;

api.use(cors(corsOptions));

api.get('/lessons', async (request, response) => {
  try {
    const result = await pool.query(`SELECT * FROM public.lessons`);
    console.log(result.rows);
    response.send(result.rows);
  } catch (error) {
    console.log('Error fetching data :', error);
    response.status(500).send('Error fetching users');
  }
});

api.get('/users', async (request, response) => {
  try {
    const credentials = fetchUsers(); //TODO: finish the mechanism of retrieving user credentials and sending only necessary pieces to FE
    console.log('Credentials: ', credentials);
  } catch (e) {
    console.error(e);
  }
});

api.get(`/lessons/:id/likes`, async (request, response) => {
  try {
    const { id } = request.params;
    const data = await prisma.lesson.findFirst({
      where: {
        id: parseInt(id),
      },
    });
    if (!data) {
      response
        .status(404)
        .json({ message: 'Error while retrieving likes from DB' });
    }

    const { likes } = data;
    response.send({ likes, data });
  } catch (err) {
    console.error(err);
  }
});

api.put(`/lessons/:id/likes`, async (request, response) => {
  try {
    const { id } = request.params;
    const lesson = await prisma.lesson.update({
      where: {
        id: Number(id),
      },
      data: { likes: { increment: 1 } },
    });
    if (!lesson) {
      return response.status(404).json({ error: 'Lesson not found' });
    }

    const newLikes = lesson.likes + 1;
    await prisma.lesson.update({
      where: {
        id: parseInt(id),
      },
      data: {
        likes: newLikes,
      },
    });
    response.send({ lesson });
  } catch (err) {
    console.error(err);
  }
});

api.listen(PORT, (err) => {
  if (err) {
    console.log('Error setting up the server', err);
  }
  console.log('Listening on port', PORT);
});

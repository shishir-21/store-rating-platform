import assert from 'node:assert/strict';
import { isUsersEmailUniqueViolation, register } from './src/routes/auth.js';

const validUser = {
  name: 'A Valid Registration Name',
  email: 'new.user@example.com',
  address: '123 Example Street',
  password: 'Password!1',
};

function createResponse() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

async function submit(body, database) {
  const response = createResponse();
  let nextError;
  await register({ body }, response, (error) => { nextError = error; }, database);
  return { response, nextError };
}

const inserts = [];
const successfulDatabase = {
  async query(_sql, values) {
    inserts.push(values);
    return { rows: [{ id: 'test-user', name: values[0], email: values[1], address: values[2], role: 'USER' }] };
  },
};

let result = await submit(validUser, successfulDatabase);
assert.equal(result.response.statusCode, 201, 'a new email registers successfully');
assert.equal(result.nextError, undefined);

result = await submit({ ...validUser, email: 'UPPERCASE@EXAMPLE.COM' }, successfulDatabase);
assert.equal(result.response.statusCode, 201, 'uppercase email registers successfully');
assert.equal(inserts.at(-1)[1], 'uppercase@example.com', 'email is lowercased before insertion');

result = await submit({ ...validUser, email: '  spaced@example.com  ' }, successfulDatabase);
assert.equal(result.response.statusCode, 201, 'whitespace-surrounded email registers successfully');
assert.equal(inserts.at(-1)[1], 'spaced@example.com', 'email is trimmed before insertion');

result = await submit(validUser, {
  async query() {
    throw { code: '23505', constraint: 'users_email_key' };
  },
});
assert.equal(result.response.statusCode, 409, 'the users email unique constraint returns conflict');
assert.deepEqual(result.response.body, { errors: { email: 'This email is already registered.' } });

result = await submit(validUser, {
  async query() {
    throw { code: '23505', constraint: 'some_other_unique_constraint' };
  },
});
assert.equal(result.response.statusCode, null, 'a different unique constraint does not become an email conflict');
assert.equal(result.nextError.constraint, 'some_other_unique_constraint');
assert.equal(isUsersEmailUniqueViolation(result.nextError), false);

result = await submit({ ...validUser, email: 'not-an-email' }, successfulDatabase);
assert.equal(result.response.statusCode, 422, 'an invalid email is rejected');
assert.equal(inserts.length, 3, 'invalid input does not reach the database');

console.log('Registration checks passed');

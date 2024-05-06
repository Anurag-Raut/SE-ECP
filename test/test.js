import app from '../app.js';
import { User } from '../server/users/user.model.js';
import { use, expect } from 'chai';
import chaiHttp from 'chai-http';
import assert from 'assert';
import { Employee } from '../server/employee/employee.model.js';

const chai = use(chaiHttp);

describe('User Routes', () => {
    
  before(async () => {
    try {
      await User.deleteMany({});
    } catch (err) {
      assert.fail(`Error clearing user collection: ${err}`);
    }
  });

  describe('POST /register', () => {
    it('should register a new user', async () => {
      try {
        const userData = {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          role: 'employee',
        };
        const res = await chai.request(app).post('/api/users/register').send(userData);
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('user');
        const user = await User.findById(res.body.user);
        expect(user).to.be.ok;
        expect(user.name).to.equal(userData.name);
        expect(user.email).to.equal(userData.email);
        expect(user.role).to.equal(userData.role);
      } catch (err) {
        assert.fail(`Error registering new user: ${err}`);
      }
    });

    it('should return 400 if email already exists', async () => {
      try {
        const userData = {
          name: 'Jane Doe',
          email: 'john@example.com', // Same email as the existing user
          password: 'password456',
          role: 'employee',
        };
        const res = await chai.request(app).post('/api/users/register').send(userData);
        expect(res).to.have.status(400);
        expect(res.body).to.have.property('message', 'email already exist');
      } catch (err) {
        assert.fail(`Error testing email already exists: ${err}`);
      }
    });
  });

  describe('POST /login', () => {
     
        let user;
    before(async () => {
        try {
            const userData =await  User.findOne({email: "john@example.com"});
            user =  userData;
        }
        catch (err) {
            assert.fail(`Error getting user: ${err}`);
        }
    })

    it('should login with valid credentials', async () => {
      try {
        const credentials = {
          email: 'john@example.com',
          password: 'password123',
        };
        const res = await chai.request(app).post('/api/users/login').send(credentials);
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('_id', user._id.toString());
        expect(res.body).to.have.property('role', user.role);
        expect(res.body).to.have.property('token');
      } catch (err) {
        assert.fail(`Error testing login with valid credentials: ${err}`);
      }
    });

    it('should return 400 if email is incorrect', async () => {
      try {
        const credentials = {
          email: 'invalid@example.com',
          password: 'password123',
        };
        const res = await chai.request(app).post('/api/users/login').send(credentials);
        expect(res).to.have.status(400);
        expect(res.body).to.have.property('message', 'email or password is wrong');
      } catch (err) {
        assert.fail(`Error testing incorrect email: ${err}`);
      }
    });

    it('should return 400 if password is incorrect', async () => {
      try {
        const credentials = {
          email: 'john@example.com',
          password: 'wrongpassword',
        };
        const res = await chai.request(app).post('/api/users/login').send(credentials);
        expect(res).to.have.status(400);
        expect(res.body).to.have.property('message', 'invalid password');
      } catch (err) {
        assert.fail(`Error testing incorrect password: ${err}`);
      }
    });
  });
});


describe('Employee Routes', () => {
  let token;
  let userId;

  before(async () => {
    try {
      const adminData = {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'adminpassword',
        role: 'admin',
      };
      const res=await chai.request(app).post('/api/users/register').send(adminData);
      const adminCredentials = {
        email: 'admin@example.com',
        password: 'adminpassword',
      };
      const loginRes = await chai.request(app).post('/api/users/login').send(adminCredentials);
      token = loginRes.body.token;
    } catch (err) {
      assert.fail(`Error registering and logging in as admin: ${err}`);
    }
  });

  after(async () => {
    try {
      await Employee.deleteMany({});
    } catch (err) {
      assert.fail(`Error clearing employee collection: ${err}`);
    }
  });

  describe('POST /api/users/newemployee', () => {
    it('should add a new employee', async () => {
      try {
        const employeeData = {
          name: 'John Doe',
          email: 'johndoe@example.com',
          doj: new Date().getTime() / 1000, // Convert to Unix timestamp
          career: 'Software Engineer',
          address: '123 Main St, Anytown USA',
          trainingRequired: true,
        };
        const res = await chai
          .request(app)
          .post('/api/users/newemployee')
          .set('AUTH_TOKEN', `Bearer ${token}`)
          .send(employeeData);
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('employee');
        userId = res.body.employee;
      } catch (err) {
        assert.fail(`Error adding new employee: ${err}`);
      }
    });

    it('should return 400 if email already exists', async () => {
      try {
        const employeeData = {
          name: 'Jane Doe',
          email: 'johndoe@example.com', // Same email as the existing employee
          doj: new Date().getTime() / 1000,
          career: 'Software Developer',
          address: '456 Oak St, Anytown USA',
          trainingRequired: false,
        };
        const res = await chai
          .request(app)
          .post('/api/users/newemployee')
          .set('AUTH_TOKEN', `Bearer ${token}`)
          .send(employeeData);
        expect(res).to.have.status(400);
        expect(res.body).to.have.property('message', 'email already exist');
      } catch (err) {
        assert.fail(`Error testing email already exists: ${err}`);
      }
    });
  });

  describe('GET /allemployee', () => {
    it('should return the list of all employees', async () => {
      try {
        const res = await chai
          .request(app)
          .get('/api/users/allemployee')
          .set('AUTH_TOKEN', `Bearer ${token}`);
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('all_employee');
        expect(res.body.all_employee.documents).to.be.an('array');
      } catch (err) {
        assert.fail(`Error getting all employees: ${err}`);
      }
    });
  });
});

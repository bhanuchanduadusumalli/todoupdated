const express = require("express");
const app = express();
app.use(express.json());
const format = require("date-fns/format");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dbpath = path.join(__dirname, "todoApplication.db");
let db = null;

const intializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("server running at http://localhost/3001");
    });
  } catch (e) {
    console.log(`${e.message}`);
    process.exit(1);
  }
};

intializeDBandServer();

const convertTodoDbObjToTodoResponseObj = (todoObj) => {
  const { id, todo, priority, status, category, due_date } = todoObj;
  return {
    id: id,
    todo: todo,
    priority: priority,
    status: status,
    category: category,
    dueDate: due_date,
  };
};
const hasPriorityAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.priority !== undefined
  );
};

const hasCategoryAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndPriorityProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

//get request
app.get("/todos/", async (request, response) => {
  let getTodosQuery = null;
  let { search_q = "", priority, status, category } = request.query;
  switch (true) {
    case hasPriorityAndStatusProperty(request.query):
      getTodosQuery = `select * from todo 
            where todo like '%${search_q}%' and
            priority='${priority}'
            and status='${status}'`;
      break;
    case hasCategoryAndStatusProperty(request.query):
      getTodosQuery = `select * from todo 
            where todo like '%${search_q}%' and
            category='${category}'
            and status='${status}'`;
      break;
    case hasCategoryAndPriorityProperty(request.query):
      getTodosQuery = `select * from todo 
            where todo like '%${search_q}%' and
            category='${category}'
            and priority='${priority}'`;
      break;
    case hasCategoryProperty(request.query):
      getTodosQuery = `select * from todo 
            where todo like '%${search_q}%' and
            category='${category}'`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `select * from todo 
            where todo like '%${search_q}%' and
            priority='${priority}'`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `select * from todo 
            where todo like '%${search_q}%' 
            and status='${status}'`;
      break;
    default:
      getTodosQuery = `select * from todo 
            where todo like '%${search_q}%'`;
      break;
  }

  const data = await db.all(getTodosQuery);
  response.send(
    data.map((eachTodo) => convertTodoDbObjToTodoResponseObj(eachTodo))
  );
});

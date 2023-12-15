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

//Get request
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodo = `select * from todo where id=${todoId}`;
  const todo = await db.get(getTodo);
  console.log(todo);
  response.send(convertTodoDbObjToTodoResponseObj(todo));
});

//Get request
app.get("/agenda/", async (request, response) => {
  try {
    const { date } = request.query;
    const formattedDate = format(new Date(date), "yyyy-MM-dd");
    //   console.log(formattedDate);
    //   console.log(typeof formattedDate);
    //   console.log(formattedDate === "2021-12-12");
    //   console.log(date);
    const getAgenda = `select * from todo 
        where due_date='${formattedDate}'`;
    const todo = await db.all(getAgenda);
    //console.log(todo);
    response.send(
      todo.map((eachTodo) => convertTodoDbObjToTodoResponseObj(eachTodo))
    );
  } catch (error) {
    response.status(400);
    response.send("Invalid Todo Status");
  }
});

//Post request
app.post("/todos/", async (request, response) => {
  const todoItem = request.body;
  const { id, todo, priority, status, category, dueDate } = todoItem;
  //console.log(request.body.todo);
  const formattedDate = format(new Date(dueDate), "yyyy-MM-dd");
  const insertTodo = `insert into todo(id,todo,priority,status,category,due_date) 
    values(${id},'${todo}','${priority}','${status}','${category}','${formattedDate}')`;
  await db.run(insertTodo);
  response.send("Todo Successfully Added");
});

//put request
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  //console.log(status);
  let updatedColumn = null;
  switch (true) {
    case requestBody.status !== undefined:
      updatedColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updatedColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updatedColumn = "Todo";
      break;
    case requestBody.category !== undefined:
      updatedColumn = "Category";
      break;
    case requestBody.dueDate !== undefined:
      updatedColumn = "Due Date";
      break;
  }
  let previousTodoQuery = `select * from todo where id=${todoId}`;
  const previousTodo = await db.get(previousTodoQuery);
  //console.log(preTodo);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.due_date,
  } = request.body;

  const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}',
      category='${category}',
      due_date='${dueDate}'
    WHERE
      id = ${todoId};`;

  await db.run(updateTodoQuery);
  response.send(`${updatedColumn} Updated`);
});

//delete request
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodo = `delete from todo where id=${todoId}`;
  await db.run(deleteTodo);
  response.send("Todo Deleted");
});

module.exports = app;

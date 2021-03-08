const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function list(req, res) {
  res.json({ data: orders });
}

function orderExists(req, res, next) {
  const orderId = req.params.orderId;

  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    next();
  }

  next({
    status: 404,
    message: `order not found: ${orderId}`,
  });
}

function read(req, res) {
  res.json({ data: res.locals.order });
}

function orderHasCorrectBody(req, res, next) {
  const {
    data: { deliverTo, mobileNumber, dishes },
  } = req.body;

  if (!dishes || !dishes.length || Array.isArray(dishes) === false) {
    next({
      status: 400,
      message: `order must include a dish`,
    });
  }

  const index = dishes.findIndex(
    (dish) =>
      !dish.quantity || dish.quantity < 0 || typeof dish.quantity !== "number"
  );

  if (!deliverTo) {
    next({
      status: 400,
      message: `Order must include a deliverTo`,
    });
  }
  if (!mobileNumber) {
    next({
      status: 400,
      message: `Order must include a mobileNumber`,
    });
  }

  if (index !== -1) {
    next({
      status: 400,
      message: `Dish ${index} must have a quantity that is an integer greater than 0`,
    });
  }
  next();
}

function create(req, res) {
  const {
    data: { deliverTo, mobileNumber, dishes },
  } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    status: "pending",
    dishes: dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function orderUpdateValidation(req, res, next) {
  const {
    data: { status, id },
  } = req.body;

  function statusChecker(status) {
    let counter = 0;
    if (status === "pending") {
      counter++;
    }
    if (status === "preparing") {
      counter++;
    }
    if (status === "out-for-delivery") {
      counter++;
    }
    if (status === "delivered") {
      counter++;
    }
    return counter;
  }
  const statusResult = statusChecker(status);

  const order = res.locals.order;
  if (id) {
    if (id !== order.id) {
      next({
        status: 400,
        message: `Order id does not match route id. Order: ${id}, Route: ${order.id}`,
      });
    }
  }
  if (!status || statusResult < 1) {
    next({
      status: 400,
      message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
    });
  }
  if (order.status === "delivered") {
    next({
      status: 400,
      message: `a delivered order cannot be changed`,
    });
  }
  next();
}

function update(req, res) {
  const order = res.locals.order;
  const {
    data: { deliverTo, mobileNumber, status, dishes },
  } = req.body;
  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes - dishes;
  res.json({ data: order });
}

function isOrderpending(req, res, next) {
  const { orderId } = req.params;
  const order = orders.find((order) => order.id === orderId);
  if (order.status !== "pending") {
    next({
      status: 400,
      message: `An order cannot be deleted unless it's pending`,
    });
  }
  next();
}

function destroy(req, res) {
  const { orderId } = req.params;
  const index = orders.findIndex(
    (order) => order.id.toString() === orderId.toString()
  );
  if (index > -1) {
    orders.splice(index, 1);
  }
  res.sendStatus(204);
}

module.exports = {
  create: [orderHasCorrectBody, create],
  read: [orderExists, read],
  update: [orderExists, orderHasCorrectBody, orderUpdateValidation, update],
  delete: [orderExists, isOrderpending, destroy],
  list,
};


// this is the part where we do what,i didn't wrote that code before,it was AI,i wanna write myself,from documentation or so

import { ApiError } from "../utils/ApiError.js";

const validate = (schema) => {

  return (req, res, next) => {
    // this schema here ,can be Register or Login joi schema we made for validations
    // it gives back two things {val,error}
    const { value, error } = schema.validate(req.body);
    if (error) throw new ApiError(400, error.details[0].message || "Required fields are not provided...")

    next();
  }
};
export default validate;
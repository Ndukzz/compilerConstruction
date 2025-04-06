import { createSlice } from "@reduxjs/toolkit";

// this creates the slice { object } containing the name, initialState and Reducers
const ErrorsSlice = createSlice({
     name: 'errors',
     initialState: {
        allErrors: ["What are thoseeee!!!"]
     },
     reducers: {
        addError: (state, action) => {
            state.push(action.payload)
        }
     }
})

export const {addError} = ErrorsSlice.actions;
export default ErrorsSlice.reducer

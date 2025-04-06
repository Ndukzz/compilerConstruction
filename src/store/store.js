import { configureStore } from "@reduxjs/toolkit";
import ErrorReducer from "./ErrorsSlice"

// import the slice and add it to the store 
export const store = configureStore({
    reducer: {
        errors: ErrorReducer
    }
})

//  import {
//      useSelector : to access the slice 
//      useDispatck : to trigger the actions in the slice
//  }

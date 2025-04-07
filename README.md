# ADA Language Compiler

This program is a compiler used to parse the ADA programming language. 
The current task is aiming to gather the local Variables in a list,
Push them to the hashTable using the method :this.HashTable.Insert(name, token, depth) # name is a list containing the vars
Display the vars using the method: this.HashTable.writeTable(depth)                    #the depth can also be omitted to display the entire table
at each depth and display them to the console



# Test File 5:

procedure test5 is
w:constant := 5;                                       #depth 1 local vars: w, z
z:integer;
a,b,c,d:real;
  procedure two (out a,b:integer ; in x,y :real) is    #depth 2 Param vars: [a, b, x, y]
  a:constant := 2.3;                                   #depth 2 Local vars: [a, b, c, d, e, f]
  b:real;
  c,d,e,f:integer;
  begin 
  end two;                                             #depth -1
begin
end test5;                                             #depth -1
                                                        

the main method i'm working on is the DeclarativePart(), it starts from the "is" keyword and ends 

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh
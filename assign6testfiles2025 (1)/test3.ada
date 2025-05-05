procedure test3 is
    x,y:integer;
    z:real;          --DEPTH 1 : A,A,X,Y,Z
  procedure a(x:integer;y:integer) is
      a,b:real;   --DEPTH 2 : A,B,X,Y
  begin
   a := x/y * (b-a);
  end a;
begin

end test3;
--DEPTH 0: TEST3 
procedure two is 
  procedure x is 
  a, b, cc, d: integer;
  begin 
    put("Enter a number: ");
    get(a);
    b := 10;
    d:= 20;
    cc:=d+a*b;
    put("The answer is ");
    putLn(cc);
  end x;
begin 
  x();
end two;
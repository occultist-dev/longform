import { longform } from "./lf.ts";

const lf = `\
root::
  main.logged-in::
    header::
      h1::
        Longform Test
  body::
    p::
      Here we are testing some long form.

#my-id
div::
  button::
    [disabled]

    My <span>Button</span>

##activate-txt
span::
  Activate
`;


const fragments = longform(lf);

console.log(fragments);

console.log();
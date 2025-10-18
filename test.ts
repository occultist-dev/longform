import { longform } from "./lf.ts";


const lf = `\
@set::
  title:: My title

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

Deno.test('it produces fragments', () => {
  const fragments = longform(lf);

  console.log(fragments);
  console.log();
})

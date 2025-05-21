<template>
  <!-- Root element for this component’s template -->
  <div class="about">
    <!-- Page heading -->
    <h1>This is an about page</h1>
  </div>
</template>

<style>
/* 
  Media query: only apply the following CSS rules when the viewport width is at least 1024px.
  “min-width: 1024px” typically targets desktop screens.
*/
@media (min-width: 1024px) {
  /* 
    Selects any element with class="about" inside this component
    (thanks to scoped CSS in Vue SFCs, it won’t leak out globally unless you remove scoped).
  */
  .about {
    /* 
      Ensure the .about container takes up at least 100% of the viewport height.
      “100vh” = 100% of the viewport height.
    */
    min-height: 100vh;

    /* 
      Switch the layout mode of this container to flexbox. 
      This enables flexible alignment of its children.
    */
    display: flex;

    /* 
      Vertically center the flex items (the <h1>) along the container’s cross axis.
      Because the default flex direction is row, “align-items: center” centers
      children vertically within the container’s height.
    */
    align-items: center;
  }
}
</style>

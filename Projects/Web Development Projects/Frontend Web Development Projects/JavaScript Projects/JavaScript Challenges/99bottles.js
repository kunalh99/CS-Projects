let numberOfBottles = 99;
while (numberOfBottles >= 0) {
  let bottleWord = "bottles";
  if (numberOfBottles === 1) {
    bottleWord = "bottle";
  }
  if (numberOfBottles === 0){
    numberOfBottles = "No more ";
  }
  console.log(numberOfBottles + " " + bottleWord + " of beer on the wall");
  console.log(numberOfBottles + " " + bottleWord + " of beer,");
  console.log("Take one down, pass it around,");
  numberOfBottles--;
  console.log(numberOfBottles + " " + bottleWord + " of beer on the wall.");
}
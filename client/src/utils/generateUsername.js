import { v4 as uuidv4 } from "uuid";

export const randomUsernameGenerator = () => {

    const arrayOfUsernameRoots = [
      "OogaBooga",
      "McDingDong",
      "TukTukMan",
      "Retardeshwar",
      "JingleBingle",
      "RockstarRaju",
      "DeepuDapper",
      "DaObliterator"
    ];

    const randomId = uuidv4();
    const username = arrayOfUsernameRoots[Math.floor(Math.random() * 8)];

    return {
        randomId,
        username
    }

}

console.log(randomUsernameGenerator());




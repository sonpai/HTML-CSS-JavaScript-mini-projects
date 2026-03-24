const answers = document.querySelectorAll(".answer");
const scoreEl = document.getElementById("score");

let score = 0;

answers.forEach(answer => {
    answer.addEventListener("click", () => {
        if (answer.innerText === "Mars") {
            score++;
            scoreEl.innerText = `Score: ${score}`;
            answer.style.background = "#c8f7c5";
        } else {
            answer.style.background = "#f7c5c5";
        }
    });
});

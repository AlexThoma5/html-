// Wait for the DOM to finish loading before running the game
/** The main game "loop", called when the game is first loaded
 * and after the users answer has been processed
 */

document.addEventListener("DOMContentLoaded", function(){
    
    // Get the button Elements and add event listeners to them
    let buttons = document.getElementsByTagName("button");

    for (let button of buttons) {
        button.addEventListener("click", function(){
            if (this.getAttribute("data-type") === "start"){
                resetGameState();
                document.getElementById("score").innerText = 0; // Resets score at DOM
                document.querySelector(".number-grid").classList.remove("disabled"); // Enable the number-grid once game has begun
                document.getElementById("start").classList.add("disabled"); // Disable start button to prevent user pressing more than once.
                runGame();
                startGameTimer();
            } else if (this.classList.contains("game-btn")){
                handleNumberClick(event);
            } else if (this.classList.contains("operator-btn")){
                handleOperatorClick(event);
            } else if (this.getAttribute("data-type") === "undo") {
                revertArray();
            } 
        })
    }

    // Game state object lives here (idea taken from chatGPT)
    const gameState = {
        num1: null,
        num1ButtonIndex: null,
        num2: null,
        num2ButtonIndex: null,
        num3: null,
        operator: null,
        clickedOp: null,
        lastClickedOp: null,
        lastClickedButton: null,
        index: null,
        step: 1,
        chosenNumber: null,
        activeArray: [],
        round: 1,
        initialArrayCopy: [],
        secondVersionArray: [],
        thirdVersionArray: [],
        fourthVersionArray: [],
        };
    
    /**
     * The function that starts the game
     */
    function runGame() {

        gameState.activeArray = getRandomSet(); // Stores the random set of numbers into the active array for the UI to display
        gameState.round = 1; // Resets the round count to 1 when new game is started
        displayNumbers(); // Displays the active array to the user
    }

    // Function that starts the game timer
    function startGameTimer() {

        let secondsLeft = 120;

        const timerId = setInterval(() => {

            // Checks if there are 0 seconds left, if so clear the timer
            if (secondsLeft === 0) {
                clearInterval(timerId);
                showScoreModal();
            }

            // Decrement seconds remaining
            secondsLeft--;
            
            // Checks if seconds is bigger than or equal to zero first to prevent showing negative numbers on timer
            if (secondsLeft >= 0) {
                // Update display to reflect how much time the user has remaining
                updateTimerDisplay(secondsLeft);
            };

        }, 1000);
    }

    function updateTimerDisplay(secondsLeft){

        // Convert the seconds left into a minutes variable
        const minutes = Math.floor(secondsLeft / 60);

        // Stores the remaining seconds into a variable
        const seconds = secondsLeft % 60;

        // Updates the UI with our respective variables, padStart is added to display the time in a MM:SS format
        document.getElementById("minutes").innerText = `${minutes}`.padStart(2, "0");
        document.getElementById("seconds").innerText = `${seconds}`.padStart(2, "0");
    }

    // Function that is called after every time the user presses a number
    // Mananges the how game behaves depending on what step it is in
    function manageGameState() {
       
        if (gameState.step === 2) {
            gameState.num1 = gameState.chosenNumber; // num1 is the button user clicks
            gameState.num1ButtonIndex = gameState.index; // Tracks the index of num1 button to update array
            document.querySelector(".operator-area").classList.remove("disabled"); // Once user has clicked a number, the operators appear
        } else if (gameState.step === 3) {
            gameState.num2 = gameState.chosenNumber; // num2 is the button user clicks
            gameState.num2ButtonIndex = gameState.index; // Tracks the index of num1 button to update array
            performCalculation(gameState.operator); // performs the calculation of the two numbers and passed operator
        } else if (gameState.step === 4) {
            storeNumberArray(); // Store the number array so we can backtrack with undo button later on
            updateNumberArray(); // After calculation update the array
            displayNumbers(); // Update the UI to reflect the updated array
            checkForWin(); // After numbers are updated, check if User has won a point
            resetGameState(); // Reset variables to send the user back to step 1
        } else if (gameState.step === 1) {
            resetGameState(); // Resets gameState if user tries to calculate a negative number
        }

        console.log("--------------------------------------------------------------------------");
        console.log(gameState);
    }

    function getRandomSet() {

        // Array of number sets that will be used in the game
        const numbersArray = [[8,8,2,7], [8,8,4,1], [6,6,8,2], [2,7,4,8], [1,5,6,3], [2,4,8,9], [8,7,1,8], [1,3,5,6]];

        // Creates random number between 0 and the array length
        const randomNum = Math.floor(Math.random() * numbersArray.length);
            
        // Stores random array from numbers array into variable
        const randomSet = numbersArray[randomNum];
        
        return randomSet;
    }

    function displayNumbers() {
        
        // Inserts the numbers from the selected array into each button
        document.getElementById('operand1').innerText = gameState.activeArray[0];
        document.getElementById('operand2').innerText = gameState.activeArray[1];
        document.getElementById('operand3').innerText = gameState.activeArray[2];
        document.getElementById('operand4').innerText = gameState.activeArray[3];

        // Stores all number buttons into a variable
        const numberButtons = document.getElementsByClassName('game-btn');

        // Loops through number buttons to check if they are empty, if they are update UI and remove empty buttons
        for (let button of numberButtons) {
            if (button.innerText.trim() === "") {
                button.style.display = 'none';
            } else {
                button.style.display = 'inline-block';
            }
        }

    }

    function handleNumberClick(event) {

        // stores clicked button into a variable
        const clickedButton = event.currentTarget;

        // Stores the index of clicked button
        gameState.index = parseInt(clickedButton.getAttribute("data-index"));

        // Deselect if same button clicked
        if (clickedButton === gameState.lastClickedButton) {
            clickedButton.classList.toggle("selected");
            gameState.chosenNumber = null;
            gameState.lastClickedButton = null;
            gameState.step = 1;
            gameState.num1 = null;
        } else {
            // Deselect previous button if any
            if (gameState.lastClickedButton) {
                gameState.lastClickedButton.classList.remove("selected");
            }
            // Select new button
            clickedButton.classList.add("selected");
            gameState.lastClickedButton = clickedButton;
            gameState.chosenNumber = clickedButton.innerText;

            if (!gameState.operator) {
                // No operator selected yet - This means the user is selecting the first number
                gameState.step = 2;
            } else {
                // Operator already selected - This means to user is selecting the second number
                gameState.step = 3;
            }
        }

        manageGameState();
    }

    function handleOperatorClick(event) {
        // Stores the clicked operator into a variable
        const clickedOp = event.currentTarget;

        // Deselect operator if same operator clicked
        if(gameState.lastClickedOp === clickedOp) {
            clickedOp.classList.toggle("selected");
            gameState.operator = null;
            gameState.lastClickedOp = null;
            gameState.step = 2;
        } else {
            // Deselect previous operator if it exists
            if (gameState.lastClickedOp) {
                gameState.lastClickedOp.classList.remove("selected");
            }
            // Select new operator
            clickedOp.classList.add("selected");
            gameState.lastClickedOp = clickedOp;
            gameState.operator = clickedOp.textContent.trim();
            gameState.step = 3;
        }

        console.log(`op: ${gameState.operator}`)
    }

    // function to perform calculation between selected numbers and update step
    function performCalculation(operator) {
        
        let answer;

        switch(operator){
            case '+':
                answer = parseInt(gameState.num1) + parseInt(gameState.num2);
                break;
            case '-':
                answer = parseInt(gameState.num1) - parseInt(gameState.num2);
                break;
            case '*':
                answer = parseInt(gameState.num1) * parseInt(gameState.num2);
                break;
            case '/':
                answer = parseInt(gameState.num1) / parseInt(gameState.num2);
                break;
        }

        // Checks if the answer is positive and an integer before assigning num3 and moving the game to step 4
        // if not, num3 is not updated and user is sent back to step 1
        if (answer > 0 && Number.isInteger(answer)) {
            gameState.num3 = answer;
            gameState.step = 4;
            manageGameState(); // recalls game state function, to perform step 4  
        } else {
            showErrorModal(answer); // calls error modal if the answer isnt viable
            gameState.step = 1;
            manageGameState();
        }
    }

    function updateNumberArray() {
        
        // Sets the num1 number to null in the array
        gameState.activeArray[gameState.num1ButtonIndex] = null;

        // Sets num2 number to the calculated number (num3) in the array
        gameState.activeArray[gameState.num2ButtonIndex] = gameState.num3;
    }

    function storeNumberArray() {

        if (gameState.round === 1) {
            gameState.initialArrayCopy = gameState.activeArray.slice(); // Create a copy of the array to store
            gameState.round++;
        } else if (gameState.round === 2) {
            gameState.secondVersionArray = gameState.activeArray.slice();
            gameState.round++;
        } else if (gameState.round === 3) {
            gameState.thirdVersionArray = gameState.activeArray.slice();
            gameState.round++;
        }
    }

    // Reverts current active array back to previous version depending on round
    function revertArray() {

        if (gameState.round === 4) {
            gameState.activeArray = gameState.thirdVersionArray.slice();
            gameState.round--;
        } else if (gameState.round === 3) {
            gameState.activeArray = gameState.secondVersionArray.slice();
            gameState.round--;
        } else if (gameState.round === 2) {
            gameState.activeArray = gameState.initialArrayCopy.slice();
            gameState.round--
        } else {
            return;
        }

        displayNumbers();
    }

    function checkForWin() {

        // Filters the numbers array, removes all falsey values. Only numbers remain.
        const filterArray = gameState.activeArray.filter(Boolean);

        if (filterArray.length === 1 && filterArray[0] === 24) {
            incrementScore();

            // Wait 0.5 seconds before starting a new round (code taken from chatGPT)
            setTimeout(() => {runGame();}, 500);
        }

    }

    /**
    * Gets the current score from the DOM and increments it by 1
    */
    function incrementScore() {

        let oldScore = parseInt(document.getElementById("score").innerText);
        document.getElementById("score").innerText = ++oldScore;
    }

    /**
     * Display the game ending modal when the game timer reaches 00:00
     */
    function showScoreModal() {

        const modal = new bootstrap.Modal(document.getElementById('gameEndingModal'));
        modal.show();
        
        // Updates the modal to match the users final score
        updateModalContent();
    }

    /**
     * Updates the game ending modal content to reflect score from DOM
     */
    function updateModalContent() {

        let finalScore = parseInt(document.getElementById("score").innerText);
        document.getElementById("finalScore").innerText = finalScore;

        // Updates user message depending on their final score
        const message = document.getElementById('game-end-message');

        if (finalScore === 0 ) {
             message.innerText = "Hey, it happens. Shake it off and try again!"
        } else if (finalScore < 5) {
            message.innerText = "Good start! Keep pushing and sharpening your skills."
        } else if (finalScore < 9) {
            message.innerText = "Good effort! Keep practising and you'll be unstoppable."
        } else if (finalScore < 13) {
            message.innerText = "Great job! You've got sharp math skills."
        } else if (finalScore >= 13) {
            message.innerText = "Incredible! You're a 24 master!"
        }
    }

    /**
     * Displays error modal to user when they make a mistake in the game
     */
    function showErrorModal(answer) {

        const errorMessage = document.getElementById("error-message");
        errorMessage.innerText = `Your result is: ${answer}.`

        const modal = new bootstrap.Modal(document.getElementById('errorModal'));
        modal.show();
    }

    function resetGameState() {
        
        // Removes class from any highlighted button when gameState is reset - Checks if it exists first to prevent error
        if (gameState.lastClickedButton) {
            gameState.lastClickedButton.classList.remove("selected");
        }
        // Removes class from lastClickedOp - Checks if it exists first to prevent error
        if (gameState.lastClickedOp) {
            gameState.lastClickedOp.classList.remove("selected");
        }
        
        // Resets variables back to original state
        gameState.num1 = null;
        gameState.num1ButtonIndex = null;
        gameState.num2 = null;
        gameState.num2ButtonIndex = null;
        gameState.num3 = null;
        gameState.index = null;
        gameState.operator = null;
        gameState.clickedOp = null;
        gameState.lastClickedOp = null;
        gameState.lastClickedButton = null;
        gameState.step = 1;
        gameState.chosenNumber = null;
        document.querySelector(".operator-area").classList.add("disabled");
    }

})

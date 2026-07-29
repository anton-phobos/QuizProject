const Database = require("better-sqlite3");

const db = new Database("quiz.db");

console.log("\n=== USERS ===");
console.table(db.prepare("SELECT * FROM users").all());

console.log("\n=== QUIZZES ===");
console.table(db.prepare("SELECT * FROM quizzes").all());

console.log("\n=== QUESTIONS ===");
console.table(
    db.prepare(`
        SELECT
            id,
            quiz_id,
            text,
            image_url,
            order_index
        FROM questions
    `).all()
);

console.log("\n=== OPTIONS ===");
console.table(
    db.prepare(`
        SELECT
            id,
            question_id,
            text,
            is_correct,
            order_index
        FROM options
    `).all()
);

console.log("\n=== GAMES ===");
console.table(db.prepare("SELECT * FROM games").all());

console.log("\n=== GAME_PLAYERS ===");
console.table(db.prepare("SELECT * FROM game_players").all());
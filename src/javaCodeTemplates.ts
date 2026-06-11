export interface SourceFile {
  name: string;
  path: string;
  language: string;
  code: string;
  description: string;
}

export const JAVA_PROJECT_FILES: SourceFile[] = [
  {
    name: "schema.sql",
    path: "WebContent/WEB-INF/schema.sql",
    language: "sql",
    description: "Database table structure for User Profiles and High Scores (MySQL / SQLite / H2 compatible).",
    code: `-- SQL schema for Block Puzzle Game database
CREATE DATABASE IF NOT EXISTS blockgame;
USE blockgame;

-- Table for User Profiles
CREATE TABLE IF NOT EXISTS users (
    username VARCHAR(50) NOT NULL PRIMARY KEY,
    avatar VARCHAR(50) DEFAULT 'avatar1',
    bio VARCHAR(255) DEFAULT 'Love playing block puzzles!',
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    games_played INT DEFAULT 0,
    high_score INT DEFAULT 0,
    total_blocks_placed INT DEFAULT 0,
    total_lines_cleared INT DEFAULT 0
);

-- Table for High Scores
CREATE TABLE IF NOT EXISTS high_scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    score INT NOT NULL,
    lines_cleared INT NOT NULL,
    score_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
);

-- Seed initial test user
INSERT INTO users (username, avatar, bio, games_played, high_score) 
VALUES ('BlockMaster', 'avatar3', 'Can anyone beat my record of 1500?', 12, 1530)
ON DUPLICATE KEY UPDATE username=username;

INSERT INTO high_scores (username, score, lines_cleared) 
VALUES ('BlockMaster', 1530, 24)
ON DUPLICATE KEY UPDATE id=id;
`
  },
  {
    name: "DBConnection.java",
    path: "src/com/game/util/DBConnection.java",
    language: "java",
    description: "Manager class providing efficient database connections utilizing thread-safe operations.",
    code: `package com.game.util;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

/**
 * Utility class to establish and manage SQL Database connections.
 */
public class DBConnection {
    // Database connection details (Adjust based on your local Eclipse setup)
    private static final String URL = "jdbc:mysql://localhost:3306/blockgame?useSSL=false&serverTimezone=UTC";
    private static final String USERNAME = "root";
    private static final String PASSWORD = "password"; // Enter your local database password

    static {
        try {
            // Load MySQL DB Driver explicitly for compatibility with Tomcat / Eclipse
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            System.err.println("Database Driver not found! Ensure MySQL Connector JAR is in your WebContent/WEB-INF/lib folder.");
            e.printStackTrace();
        }
    }

    /**
     * Obtains a standard SQL connection to the database.
     */
    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(URL, USERNAME, PASSWORD);
    }
}
`
  },
  {
    name: "User.java",
    path: "src/com/game/model/User.java",
    language: "java",
    description: "JavaBean encapsulating User Details. Meets JSTL and Expression Language (EL) getter/setter specifications.",
    code: `package com.game.model;

import java.io.Serializable;
import java.sql.Timestamp;

/**
 * JavaBean model for managing user state.
 */
public class User implements Serializable {
    private static final long serialVersionUID = 1L;

    private String username;
    private String avatar;
    private String bio;
    private Timestamp registeredAt;
    private int gamesPlayed;
    private int highScore;
    private int totalBlocksPlaced;
    private int totalLinesCleared;

    // Default No-Arg Constructor Required by JavaBeans & JSTL
    public User() {}

    public User(String username, String avatar, String bio) {
        this.username = username;
        this.avatar = avatar;
        this.bio = bio;
    }

    // Getters and Setters matching EL standard exactly (e.g. \${user.username})
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public Timestamp getRegisteredAt() { return registeredAt; }
    public void setRegisteredAt(Timestamp registeredAt) { this.registeredAt = registeredAt; }

    public int getGamesPlayed() { return gamesPlayed; }
    public void setGamesPlayed(int gamesPlayed) { this.gamesPlayed = gamesPlayed; }

    public int getHighScore() { return highScore; }
    public void setHighScore(int highScore) { this.highScore = highScore; }

    public int getTotalBlocksPlaced() { return totalBlocksPlaced; }
    public void setTotalBlocksPlaced(int totalBlocksPlaced) { this.totalBlocksPlaced = totalBlocksPlaced; }

    public int getTotalLinesCleared() { return totalLinesCleared; }
    public void setTotalLinesCleared(int totalLinesCleared) { this.totalLinesCleared = totalLinesCleared; }
}
`
  },
  {
    name: "HighScore.java",
    path: "src/com/game/model/HighScore.java",
    language: "java",
    description: "JavaBean model tracking high scores for rendering on leaderboards with JSTL c:forEach.",
    code: `package com.game.model;

import java.io.Serializable;
import java.sql.Timestamp;

public class HighScore implements Serializable {
    private static final long serialVersionUID = 1L;

    private int id;
    private String username;
    private int score;
    private int linesCleared;
    private Timestamp date;

    public HighScore() {}

    public HighScore(String username, int score, int linesCleared) {
        this.username = username;
        this.score = score;
        this.linesCleared = linesCleared;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }

    public int getLinesCleared() { return linesCleared; }
    public void setLinesCleared(int linesCleared) { this.linesCleared = linesCleared; }

    public Timestamp getDate() { return date; }
    public void setDate(Timestamp date) { this.date = date; }
}
`
  },
  {
    name: "UserDAO.java",
    path: "src/com/game/dao/UserDAO.java",
    language: "java",
    description: "Efficient Data Access Object running parameterized SQL queries with try-with-resources.",
    code: `package com.game.dao;

import com.game.model.User;
import com.game.util.DBConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class UserDAO {

    /**
     * Fetches user profile from database by username.
     */
    public User getByUsername(String username) {
        String sql = "SELECT * FROM users WHERE username = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setString(1, username);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    User user = new User();
                    user.setUsername(rs.getString("username"));
                    user.setAvatar(rs.getString("avatar"));
                    user.setBio(rs.getString("bio"));
                    user.setRegisteredAt(rs.getTimestamp("registered_at"));
                    user.setGamesPlayed(rs.getInt("games_played"));
                    user.setHighScore(rs.getInt("high_score"));
                    user.setTotalBlocksPlaced(rs.getInt("total_blocks_placed"));
                    user.setTotalLinesCleared(rs.getInt("total_lines_cleared"));
                    return user;
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    /**
     * Registers a new user.
     */
    public boolean registerUser(User user) {
        String sql = "INSERT INTO users (username, avatar, bio) VALUES (?, ?, ?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setString(1, user.getUsername());
            pstmt.setString(2, user.getAvatar());
            pstmt.setString(3, user.getBio());
            
            return pstmt.executeUpdate() > 0;
        } catch (SQLException e) {
            // Usually returns false if username already exists
            e.printStackTrace();
        }
        return false;
    }

    /**
     * Updates an existing profile (avatar, bio).
     */
    public boolean updateProfile(User user) {
        String sql = "UPDATE users SET avatar = ?, bio = ? WHERE username = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setString(1, user.getAvatar());
            pstmt.setString(2, user.getBio());
            pstmt.setString(3, user.getUsername());
            
            return pstmt.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    /**
     * Updates profile stats when a block game finishes.
     */
    public boolean updateStats(String username, int score, int linesCleared, int blocksPlaced) {
        String sql = "UPDATE users SET games_played = games_played + 1, " +
                     "total_blocks_placed = total_blocks_placed + ?, " +
                     "total_lines_cleared = total_lines_cleared + ?, " +
                     "high_score = GREATEST(high_score, ?) " +
                     "WHERE username = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setInt(1, blocksPlaced);
            pstmt.setInt(2, linesCleared);
            pstmt.setInt(3, score);
            pstmt.setString(4, username);
            
            return pstmt.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }
}
`
  },
  {
    name: "HighScoreDAO.java",
    path: "src/com/game/dao/HighScoreDAO.java",
    language: "java",
    description: "Data Access Object interacting with High Scores list including queries to extract the top-performing players.",
    code: `package com.game.dao;

import com.game.model.HighScore;
import com.game.util.DBConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class HighScoreDAO {

    /**
     * Submits a new high-score record and triggers user stats calculation.
     */
    public boolean saveScore(HighScore score) {
        String sql = "INSERT INTO high_scores (username, score, lines_cleared) VALUES (?, ?, ?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setString(1, score.getUsername());
            pstmt.setInt(2, score.getScore());
            pstmt.setInt(3, score.getLinesCleared());
            
            return pstmt.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    /**
     * Fetches top high scores for the overall application leaderboard.
     */
    public List<HighScore> getTopScores(int limit) {
        List<HighScore> scoresList = new ArrayList<>();
        String sql = "SELECT * FROM high_scores ORDER BY score DESC, score_date ASC LIMIT ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setInt(1, limit);
            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    HighScore score = new HighScore();
                    score.setId(rs.getInt("id"));
                    score.setUsername(rs.getString("username"));
                    score.setScore(rs.getInt("score"));
                    score.setLinesCleared(rs.getInt("lines_cleared"));
                    score.setDate(rs.getTimestamp("score_date"));
                    scoresList.add(score);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return scoresList;
    }
}
`
  },
  {
    name: "GameServlet.java",
    path: "src/com/game/controller/GameServlet.java",
    language: "java",
    description: "Core Servlet handling user profiles, loading JSTL view attributes, and receiving POST game records.",
    code: `package com.game.controller;

import com.game.dao.HighScoreDAO;
import com.game.dao.UserDAO;
import com.game.model.HighScore;
import com.game.model.User;

import java.io.IOException;
import java.util.List;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

/**
 * Controller servlet to load profiles, leaderboard data, and update gameplay stats.
 */
@WebServlet("/game")
public class GameServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private UserDAO userDAO;
    private HighScoreDAO highScoreDAO;

    @Override
    public void init() throws ServletException {
        userDAO = new UserDAO();
        highScoreDAO = new HighScoreDAO();
    }

    /**
     * Renders primary view with the JSTL-based high scores and active session profile.
     */
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        HttpSession session = request.getSession();
        String username = (String) session.getAttribute("username");

        // Set default guest session if none exists
        if (username == null) {
            username = "GuestPlayer";
            session.setAttribute("username", username);
            
            // Check if Guest is in DB, if not register
            if (userDAO.getByUsername(username) == null) {
                User guest = new User(username, "avatar1", "A simple guest player!");
                userDAO.registerUser(guest);
            }
        }

        // Retrieve full profile from DAO
        User user = userDAO.getByUsername(username);
        request.setAttribute("currentUser", user);

        // Retrieve global top high scores using JSTL binding
        List<HighScore> topScores = highScoreDAO.getTopScores(10);
        request.setAttribute("leaderboard", topScores);

        // Forward safely list to JSP view
        request.getRequestDispatcher("/index.jsp").forward(request, response);
    }

    /**
     * Receives POST scores from the frontend, updating stats and redirecting.
     */
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        request.setCharacterEncoding("UTF-8");
        String action = request.getParameter("action");
        HttpSession session = request.getSession();

        if ("change_profile".equals(action)) {
            String newUsername = request.getParameter("username").trim();
            String avatar = request.getParameter("avatar");
            String bio = request.getParameter("bio");

            if (newUsername.isEmpty()) {
                response.sendRedirect(request.getContextPath() + "/game?error=invalidname");
                return;
            }

            // Standard profile persistence check
            User existing = userDAO.getByUsername(newUsername);
            if (existing == null) {
                // Registering new name, delete old if it was dynamic
                User user = new User(newUsername, avatar, bio);
                userDAO.registerUser(user);
                session.setAttribute("username", newUsername);
            } else {
                // Updating details
                existing.setAvatar(avatar);
                existing.setBio(bio);
                userDAO.updateProfile(existing);
                session.setAttribute("username", newUsername);
            }
            response.sendRedirect(request.getContextPath() + "/game?msg=profile_updated");

        } else if ("save_score".equals(action)) {
            String username = (String) session.getAttribute("username");
            if (username == null) username = "GuestPlayer";

            try {
                int scoreVal = Integer.parseInt(request.getParameter("score"));
                int lines = Integer.parseInt(request.getParameter("lines"));
                int blocks = Integer.parseInt(request.getParameter("blocks"));

                // Save to HighScores
                HighScore scoreObj = new HighScore(username, scoreVal, lines);
                highScoreDAO.saveScore(scoreObj);

                // Update cumulative user stats (UserDAO handles HIGHEST check logic)
                userDAO.updateStats(username, scoreVal, lines, blocks);

                response.setStatus(HttpServletResponse.SC_OK);
                response.getWriter().write("{\\"status\\":\\"success\\"}");
            } catch (NumberFormatException e) {
                response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Invalid stats values provided!");
            }
        }
    }
}
`
  },
  {
    name: "index.jsp",
    path: "WebContent/index.jsp",
    language: "html",
    description: "JSP View integrating CSS game layout with standard JSTL core loops (<c:forEach>) and Expression Languages (${currentUser.username}).",
    code: `<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/fmt" prefix="fmt" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>8x8 Block Puzzle Game</title>
    <!-- Tailwind CSS CDN for elegant modern layout inside Eclipse -->
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .cell-empty { background-color: rgba(255, 255, 255, 0.05); }
        .cell-filled { box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.2); }
    </style>
</head>
<body class="bg-slate-900 text-white min-h-screen font-sans flex flex-col justify-between">

    <!-- Header Section using EL -->
    <header class="bg-slate-800 border-b border-slate-700 py-4 px-6 flex justify-between items-center shadow-lg">
        <div class="flex items-center space-x-3">
            <span class="text-3xl">🧩</span>
            <div>
                <h1 class="text-xl font-bold tracking-tight text-white">8x8 Block Puzzle</h1>
                <p class="text-xs text-slate-400">Offline JSP Mobile Version</p>
            </div>
        </div>
        <div class="flex items-center space-x-3">
            <div class="text-right">
                <p class="text-sm font-semibold">\${currentUser.username}</p>
                <p class="text-xs text-amber-400">High Score: \${currentUser.highScore}</p>
            </div>
            <div class="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold border-2 border-indigo-400 shadow">
                <!-- Direct avatar presentation -->
                \${currentUser.username.substring(0, 2).toUpperCase()}
            </div>
        </div>
    </header>

    <!-- Main Grid layout -->
    <main class="max-w-4xl mx-auto p-4 flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        <!-- User Stats Panel using Expression Language -->
        <div class="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-md">
            <h2 class="text-lg font-bold mb-4 flex items-center gap-2">
                👤 User Profile
            </h2>
            <div class="space-y-3 text-sm text-slate-300">
                <p>Username: <strong class="text-white">\${currentUser.username}</strong></p>
                <p>Bio: <em class="text-slate-400">"\${currentUser.bio}"</em></p>
                <hr class="border-slate-700">
                <p>Played Games: <strong class="text-white">\${currentUser.gamesPlayed}</strong></p>
                <p>Personal Best: <strong class="text-amber-400">\${currentUser.highScore} points</strong></p>
                <p>Blocks Placed: <strong class="text-white">\${currentUser.totalBlocksPlaced}</strong></p>
                <p>Lines Cleared: <strong class="text-white">\${currentUser.totalLinesCleared}</strong></p>
            </div>

            <!-- Profile form -->
            <form action="game" method="post" class="mt-6 space-y-3">
                <input type="hidden" name="action" value="change_profile">
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1">Rename Profile</label>
                    <input type="text" name="username" value="\${currentUser.username}" class="w-full bg-slate-900 border border-slate-700 rounded-lg py-1.5 px-3 text-xs focus:ring-1 focus:ring-indigo-500 outline-none">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-400 mb-1">Status Bio</label>
                    <input type="text" name="bio" value="\${currentUser.bio}" class="w-full bg-slate-900 border border-slate-700 rounded-lg py-1.5 px-3 text-xs focus:ring-1 focus:ring-indigo-500 outline-none">
                </div>
                <button type="submit" class="w-full bg-indigo-500 hover:bg-indigo-600 transition text-xs font-bold py-2 rounded-lg text-white">
                    Update Details
                </button>
            </form>
        </div>

        <!-- Block Game Area (JS logic integrates with Servlet endpoint) -->
        <div class="bg-slate-800 p-6 rounded-3xl border border-slate-700 flex flex-col items-center">
            <div class="w-full flex justify-between items-center mb-4">
                <div class="text-left">
                    <span class="text-xs text-slate-400 uppercase tracking-widest font-bold">SCORE</span>
                    <h2 id="js-score" class="text-3xl font-extrabold text-white">0</h2>
                </div>
                <div class="text-right">
                    <span class="text-xs text-slate-400 uppercase tracking-widest font-semibold">BEST SCORE</span>
                    <h2 class="text-3xl font-black text-amber-400">\${currentUser.highScore}</h2>
                </div>
            </div>

            <!-- Game Board (8x8 cells) -->
            <div id="game-board" class="grid grid-cols-8 gap-1.5 p-3 bg-slate-950 rounded-2xl border-4 border-slate-850 w-full max-w-[320px] aspect-square">
                <!-- Generated by JS -->
            </div>

            <div class="w-full mt-6 text-center text-xs text-slate-400">
                <p class="font-medium p-1 bg-slate-900/60 rounded-md">Tap a shape underneath, then click cell on board to place!</p>
            </div>

            <!-- Block Choices container -->
            <div id="block-choices" class="flex justify-around items-center gap-2 mt-6 w-full min-h-[100px]">
                <!-- Filled dynamically by JavaScript -->
            </div>
        </div>

        <!-- Leaderboard list with JSTL Core c:forEach loop -->
        <div class="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-md">
            <h2 class="text-lg font-bold mb-4 flex items-center gap-2 text-amber-400">
                🏆 Top High Scores
            </h2>
            <div class="space-y-2 max-h-[380px] overflow-y-auto">
                <c:choose>
                    <c:when class="empty-list" test="\${empty leaderboard}">
                        <p class="text-sm text-slate-500 italic text-center py-8">No high scores registered yet!</p>
                    </c:when>
                    <c:otherwise>
                        <c:forEach var="item" items="\${leaderboard}" varStatus="status">
                            <div class="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                                <div class="flex items-center space-x-3">
                                    <span class="font-bold text-sm w-5 text-center \${status.index < 3 ? 'text-amber-400' : 'text-slate-500'}">
                                        \${status.count}
                                    </span>
                                    <div>
                                        <p class="text-sm font-semibold text-white">\${item.username}</p>
                                        <p class="text-[10px] text-slate-500">
                                            <fmt:formatDate value="\${item.date}" pattern="yyyy-MM-dd HH:mm"/>
                                        </p>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <span class="font-bold text-indigo-400 text-sm">\${item.score}</span>
                                    <p class="text-[10px] text-slate-500">\${item.linesCleared} lines</p>
                                </div>
                            </div>
                        </c:forEach>
                    </c:otherwise>
                </c:choose>
            </div>
        </div>

    </main>

    <!-- JavaScript block puzzle game implementation -->
    <script>
        const API_URL = "game";
        const BOARD_SIZE = 8;
        let board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
        let score = 0;
        let selectedBlockIndex = null;
        let blocksPlacedCount = 0;
        let linesClearedCount = 0;

        // Custom shapes list
        const SHAPES = [
            { id: "dot", matrix: [[1]], color: "bg-amber-400" },
            { id: "line2", matrix: [[1, 1]], color: "bg-orange-500" },
            { id: "line3", matrix: [[1, 1, 1]], color: "bg-rose-500" },
            { id: "v_line2", matrix: [[1], [1]], color: "bg-orange-500" },
            { id: "v_line3", matrix: [[1], [1], [1]], color: "bg-rose-500" },
            { id: "square", matrix: [[1, 1], [1, 1]], color: "bg-emerald-500" },
            { id: "corner", matrix: [[1, 0], [1, 1]], color: "bg-cyan-400" }
        ];

        let activeBlocks = [];

        function initGame() {
            createBoardUI();
            generateNewBlocks();
            renderActiveBlocks();
        }

        function createBoardUI() {
            const boardEl = document.getElementById("game-board");
            boardEl.innerHTML = "";
            for (let r = 0; r < BOARD_SIZE; r++) {
                for (let c = 0; c < BOARD_SIZE; c++) {
                    const cell = document.createElement("button");
                    cell.className = "w-full aspect-square rounded cell-empty transition focus:outline-none hover:bg-slate-800";
                    cell.dataset.row = r;
                    cell.dataset.col = c;
                    cell.addEventListener("click", () => handleCellClick(r, c));
                    boardEl.appendChild(cell);
                }
            }
        }

        function generateNewBlocks() {
            activeBlocks = [];
            for (let i = 0; i < 3; i++) {
                const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
                activeBlocks.push({...shape});
            }
        }

        function renderBoard() {
            const boardEl = document.getElementById("game-board");
            const cells = boardEl.children;
            for (let r = 0; r < BOARD_SIZE; r++) {
                for (let c = 0; c < BOARD_SIZE; c++) {
                    const idx = r * BOARD_SIZE + c;
                    const cell = cells[idx];
                    const color = board[r][c];
                    if (color) {
                        cell.className = \`w-full aspect-square rounded cell-filled \${color} transition\`;
                    } else {
                        cell.className = "w-full aspect-square rounded cell-empty transition hover:bg-slate-800";
                    }
                }
            }
        }

        function renderActiveBlocks() {
            const container = document.getElementById("block-choices");
            container.innerHTML = "";
            activeBlocks.forEach((block, idx) => {
                if (!block) {
                    const placeholder = document.createElement("div");
                    placeholder.className = "w-20 h-20 opacity-20 border border-dashed border-slate-700 rounded-xl";
                    container.appendChild(placeholder);
                    return;
                }

                const btn = document.createElement("button");
                btn.className = \`p-3 bg-slate-900/80 hover:bg-slate-700/80 border \${selectedBlockIndex === idx ? 'border-indigo-400 ring-2 ring-indigo-500 scale-105' : 'border-slate-700'} rounded-2xl flex flex-col items-center justify-center transition w-24 h-24 focus:outline-none\`;
                btn.addEventListener("click", () => {
                    selectedBlockIndex = selectedBlockIndex === idx ? null : idx;
                    renderActiveBlocks();
                });

                // Shape Preview Mini Map
                const grid = document.createElement("div");
                const rows = block.matrix.length;
                const cols = block.matrix[0].length;
                grid.className = \`grid gap-0.5\`;
                grid.style.gridTemplateColumns = \`repeat(\${cols}, minmax(0, 1fr))\`;

                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        const sq = document.createElement("div");
                        sq.className = block.matrix[r][c] ? \`w-3 h-3 rounded-sm \${block.color}\` : "w-3 h-3 invisible";
                        grid.appendChild(sq);
                    }
                }
                btn.appendChild(grid);
                container.appendChild(btn);
            });
        }

        function handleCellClick(startRow, startCol) {
            if (selectedBlockIndex === null) return;
            const block = activeBlocks[selectedBlockIndex];
            if (!block) return;

            // Place Block Check
            if (canPlaceBlock(block.matrix, startRow, startCol)) {
                placeBlock(block, startRow, startCol);
                activeBlocks[selectedBlockIndex] = null;
                selectedBlockIndex = null;
                
                // If all 3 slots empty, fill again
                if (activeBlocks.every(b => b === null)) {
                    generateNewBlocks();
                }

                renderBoard();
                renderActiveBlocks();
                checkGameOver();
            } else {
                alert("This block won me fit in that position! Try another coordinate.");
            }
        }

        function canPlaceBlock(matrix, startR, startC) {
            const rows = matrix.length;
            const cols = matrix[0].length;
            
            if (startR + rows > BOARD_SIZE || startC + cols > BOARD_SIZE) return false;
            
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (matrix[r][c] === 1) {
                        if (board[startR + r][startC + c] !== null) return false;
                    }
                }
            }
            return true;
        }

        function placeBlock(block, startR, startC) {
            const matrix = block.matrix;
            const rows = matrix.length;
            const cols = matrix[0].length;
            let addedCells = 0;

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (matrix[r][c] === 1) {
                        board[startR + r][startC + c] = block.color;
                        addedCells++;
                    }
                }
            }

            score += addedCells;
            blocksPlacedCount += addedCells;
            checkLines();
            document.getElementById("js-score").innerText = score;
        }

        function checkLines() {
            let clearedRows = [];
            let clearedCols = [];

            // Check Rows
            for (let r = 0; r < BOARD_SIZE; r++) {
                let counts = 0;
                for (let c = 0; c < BOARD_SIZE; c++) {
                    if (board[r][c] !== null) counts++;
                }
                if (counts === BOARD_SIZE) clearedRows.push(r);
            }

            // Check Cols
            for (let c = 0; c < BOARD_SIZE; c++) {
                let counts = 0;
                for (let r = 0; r < BOARD_SIZE; r++) {
                    if (board[r][c] !== null) counts++;
                }
                if (counts === BOARD_SIZE) clearedCols.push(c);
            }

            // Clear cells
            clearedRows.forEach(r => {
                for (let c = 0; c < BOARD_SIZE; c++) board[r][c] = null;
            });
            clearedCols.forEach(c => {
                for (let r = 0; r < BOARD_SIZE; r++) board[r][c] = null;
            });

            const clearedCount = clearedRows.length + clearedCols.length;
            if (clearedCount > 0) {
                // Combo styling + Scoring calculation
                score += clearedCount * 10 + (clearedCount - 1) * 5;
                linesClearedCount += clearedCount;
            }
        }

        function checkGameOver() {
            // Check if any of the existing blocks can fit on the board
            let possiblePlacement = false;
            const liveBlocks = activeBlocks.filter(b => b !== null);
            
            if (liveBlocks.length === 0) return; // All placements done

            for (let b = 0; b < liveBlocks.length; b++) {
                const block = liveBlocks[b];
                for (let r = 0; r < BOARD_SIZE; r++) {
                    for (let c = 0; c < BOARD_SIZE; c++) {
                        if (canPlaceBlock(block.matrix, r, c)) {
                            possiblePlacement = true;
                            break;
                        }
                    }
                    if (possiblePlacement) break;
                }
                if (possiblePlacement) break;
            }

            if (!possiblePlacement) {
                alert("Game Over! Score: " + score + ". Submitting high score records to Eclipse DB...");
                submitScore();
            }
        }

        function submitScore() {
            // Post records to servlet matching GameServlet schema
            const formData = new URLSearchParams();
            formData.append("action", "save_score");
            formData.append("score", score);
            formData.append("lines", linesClearedCount);
            formData.append("blocks", blocksPlacedCount);

            fetch(API_URL, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: formData.toString()
            })
            .then(res => {
                if (res.ok) {
                    window.location.reload(); // Refresh scores list
                }
            })
            .catch(err => console.error("Error storing high score:", err));
        }

        // Run on load
        window.onload = initGame;
    </script>
</body>
</html>
`
  },
  {
    name: "web.xml",
    path: "WebContent/WEB-INF/web.xml",
    language: "xml",
    description: "Deployment Descriptor declaring Tomcat servlet endpoints and specifying welcoming view pages.",
    code: `<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns="https://jakarta.ee/xml/ns/jakartaee"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="https://jakarta.ee/xml/ns/jakartaee https://jakarta.ee/xml/ns/jakartaee/web-app_5_0.xsd"
         version="5.0">
    
    <display-name>8x8BlockPuzzleGame</display-name>

    <welcome-file-list>
        <welcome-file>game</welcome-file>
    </welcome-file-list>

    <!-- Context listeners / configuration properties can enter here -->

</web-app>
`
  }
];

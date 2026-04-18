<?php
/**
 * auth/login.php — Login Page
 * Online Music Shop — SwarBazaar
 */

define('ROOT_PATH', dirname(__DIR__) . DIRECTORY_SEPARATOR);
define('ROOT_URL', '../');

require_once ROOT_PATH . 'config/helpers.php';
require_once ROOT_PATH . 'config/db.php';

// Already logged in → go home
if (isLoggedIn()) redirect(ROOT_URL . 'index.php');

$error      = '';
$redirect   = $_GET['redirect'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $login    = trim($_POST['login'] ?? '');     // username OR email
    $password = $_POST['password'] ?? '';

    if ($login === '' || $password === '') {
        $error = 'Please fill in both fields.';
    } else {
        $pdo  = getPDO();
        $stmt = $pdo->prepare(
            "SELECT u.*, c.customer_id FROM users u
             LEFT JOIN customers c ON c.user_id = u.user_id
             WHERE u.username = ? OR u.email = ? LIMIT 1"
        );
        $stmt->execute([$login, $login]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password'])) {
            // Regenerate session ID to prevent session fixation
            session_regenerate_id(true);
            $_SESSION['user_id']     = $user['user_id'];
            $_SESSION['username']    = $user['username'];
            $_SESSION['role']        = $user['role'];
            $_SESSION['customer_id'] = $user['customer_id'] ?? null;

            if ($redirect) {
                redirect($redirect);
            } elseif ($user['role'] === 'admin') {
                redirect(ROOT_URL . 'admin/dashboard.php');
            } else {
                redirect(ROOT_URL . 'index.php');
            }
        } else {
            $error = 'Invalid username/email or password.';
        }
    }
}

$pageTitle = 'Login';
include ROOT_PATH . 'includes/header.php';
?>
<div class="auth-wrapper">
    <div class="auth-card">
        <div class="text-center mb-4">
            <div class="auth-logo"><i class="bi bi-music-note-beamed"></i></div>
            <h2 class="fw-bold">Welcome Back</h2>
            <p class="text-muted small">Sign in to your SwarBazaar account</p>
        </div>

        <?php if ($error): ?>
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <i class="bi bi-exclamation-circle me-2"></i><?= h($error) ?>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="alert"></button>
            </div>
        <?php endif; ?>

        <form action="login.php<?= $redirect ? '?redirect=' . urlencode($redirect) : '' ?>"
              method="POST" id="loginForm" novalidate>

            <div class="mb-3">
                <label for="loginInput" class="form-label">Username or Email</label>
                <div class="input-group">
                    <span class="input-group-text" style="background:var(--surface-3);border-color:var(--border);color:var(--text-muted)">
                        <i class="bi bi-person"></i>
                    </span>
                    <input type="text" class="form-control" id="loginInput" name="login"
                           placeholder="admin or alice@mail.com"
                           value="<?= h($_POST['login'] ?? '') ?>" required autofocus>
                </div>
            </div>

            <div class="mb-4">
                <label for="passwordInput" class="form-label">Password</label>
                <div class="input-group">
                    <span class="input-group-text" style="background:var(--surface-3);border-color:var(--border);color:var(--text-muted)">
                        <i class="bi bi-lock"></i>
                    </span>
                    <input type="password" class="form-control" id="passwordInput" name="password"
                           placeholder="Your password" required>
                    <button type="button" class="input-group-text" id="togglePwd"
                            style="background:var(--surface-3);border-color:var(--border);color:var(--text-muted);cursor:pointer"
                            onclick="
                                const f=document.getElementById('passwordInput');
                                const i=this.querySelector('i');
                                f.type=f.type==='password'?'text':'password';
                                i.className=f.type==='password'?'bi bi-eye':'bi bi-eye-slash';
                            ">
                        <i class="bi bi-eye"></i>
                    </button>
                </div>
            </div>

            <button type="submit" class="btn btn-primary w-100 py-2 fw-semibold" id="loginSubmitBtn">
                <i class="bi bi-box-arrow-in-right me-2"></i>Login
            </button>
        </form>

        <hr style="border-color:var(--border);margin:1.5rem 0">

        <p class="text-center text-muted small mb-0">
            Don't have an account?
            <a href="register.php" class="fw-semibold">Register here</a>
        </p>

        <!-- Demo credentials hint -->
        <div class="mt-4 p-3 rounded" style="background:var(--glass);border:1px solid var(--border)">
            <p class="small fw-semibold text-muted mb-2"><i class="bi bi-info-circle me-1"></i>Demo Credentials</p>
            <table class="table table-sm mb-0" style="font-size:.8rem">
                <thead><tr><th>Username</th><th>Password</th><th>Role</th></tr></thead>
                <tbody>
                    <tr><td>admin</td><td>password</td><td><span class="badge bg-warning text-dark">Admin</span></td></tr>
                    <tr><td>alice</td><td>password</td><td><span class="badge bg-primary">Customer</span></td></tr>
                    <tr><td>bob</td><td>password</td><td><span class="badge bg-primary">Customer</span></td></tr>
                </tbody>
            </table>
        </div>
    </div>
</div>

<?php include ROOT_PATH . 'includes/footer.php'; ?>
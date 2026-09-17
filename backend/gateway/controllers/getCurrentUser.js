/* ──────────────────────────────────────────
   GET CURRENT USER
   GET /api/me
   Headers: Cookie (resq_sid)
   ──────────────────────────────────────────
   Ye gateway pe handle hota hai.
   Downstream service ko forward nahi hota.
   ────────────────────────────────────────── */

export const getCurrentUser = async (req, res) => {
  try {
    // req.user set hai protect middleware se
    if (!req.user) {
      return res.status(401).json({
        success: false,
        code: "NO_SESSION",
        message: "Not authenticated",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        userId: req.user.userId,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar,
        roles: req.user.roles,
        twoFactorVerified: req.user.twoFactorVerified,
        hospitalId: req.user.hospitalId || null,
        ambulanceId: req.user.ambulanceId || null,
      },
    });
  } catch (error) {
    console.error("getCurrentUser error:", error);
    return res.status(500).json({
      success: false,
      code: "ME_FAILED",
      message: "Failed to fetch user",
    });
  }
};
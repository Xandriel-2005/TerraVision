"""
TerraVision IBVAP — Night / Low-Light Frame Enhancement

Applies CLAHE (Contrast Limited Adaptive Histogram Equalization) and
other preprocessing to improve detection quality in low-light and
infrared camera feeds. Auto-detects when enhancement is needed.
"""

import cv2
import numpy as np


class NightEnhancer:
    """
    Preprocesses frames for improved AI detection in low-light conditions.

    The enhancer auto-detects frame brightness and applies CLAHE only
    when the average luminance falls below the configured threshold.
    This avoids over-processing well-lit daytime footage.

    Usage:
        enhancer = NightEnhancer()
        enhanced_frame = enhancer.process(frame)
    """

    def __init__(
        self,
        clip_limit: float = 3.0,
        tile_size: int = 8,
        brightness_threshold: int = 80,
        auto_detect: bool = True,
    ):
        """
        Args:
            clip_limit: CLAHE contrast limiting parameter (higher = more contrast)
            tile_size: Size of the grid tiles for adaptive equalization
            brightness_threshold: Frames with mean brightness below this get enhanced
            auto_detect: If True, only enhance dark frames. If False, enhance all frames.
        """
        self.clip_limit = clip_limit
        self.tile_size = tile_size
        self.brightness_threshold = brightness_threshold
        self.auto_detect = auto_detect

        self.clahe = cv2.createCLAHE(
            clipLimit=clip_limit, tileGridSize=(tile_size, tile_size)
        )

        self._last_brightness: float = 0.0
        self._was_enhanced: bool = False

    def process(self, frame: np.ndarray) -> np.ndarray:
        """
        Process a frame, applying enhancement if needed.

        Args:
            frame: BGR image (numpy array from OpenCV)

        Returns:
            Enhanced BGR image (or original if not needed)
        """
        # Convert to LAB color space for brightness analysis
        lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
        l_channel, a_channel, b_channel = cv2.split(lab)

        # Check brightness
        self._last_brightness = float(np.mean(l_channel))

        if self.auto_detect and self._last_brightness >= self.brightness_threshold:
            self._was_enhanced = False
            return frame

        # Apply CLAHE to the L (luminance) channel
        enhanced_l = self.clahe.apply(l_channel)

        # Merge back and convert to BGR
        enhanced_lab = cv2.merge([enhanced_l, a_channel, b_channel])
        enhanced_bgr = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)

        # Optional: slight denoise for very dark frames
        if self._last_brightness < 40:
            enhanced_bgr = cv2.fastNlMeansDenoisingColored(
                enhanced_bgr, None, h=6, hForColorComponents=6,
                templateWindowSize=7, searchWindowSize=21
            )

        self._was_enhanced = True
        return enhanced_bgr

    @property
    def last_brightness(self) -> float:
        """Mean brightness of the last processed frame (0-255)."""
        return self._last_brightness

    @property
    def was_enhanced(self) -> bool:
        """Whether the last frame was enhanced."""
        return self._was_enhanced

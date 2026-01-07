#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
נחשון - Nachshon Hebrew Programming Language
Run this script to start the CLI
"""

import sys
import os

# Add src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from cli import main

if __name__ == "__main__":
    main()

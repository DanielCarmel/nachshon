#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
נחשון - Nachshon Hebrew Programming Language
Run this script to start the CLI
"""

import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(__file__))

from nachshon.cli import main

if __name__ == "__main__":
    main()

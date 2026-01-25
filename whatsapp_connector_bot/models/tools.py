
import platform
from sys import version_info
if platform.system() == 'Windows':
    from .tools_w import optimize_ai, prompt_save, prompt_delete, ai_run
elif version_info >= (3, 12):
    from .tools_312 import optimize_ai, prompt_save, prompt_delete, bot_get_ai, ai_run
elif version_info >= (3, 10):
    from .tools_310 import optimize_ai, prompt_save, prompt_delete, bot_get_ai, ai_run
else:
    from .tools_38 import optimize_ai, prompt_save, prompt_delete, bot_get_ai, ai_run

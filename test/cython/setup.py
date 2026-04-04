from setuptools import setup, Extension
from Cython.Build import cythonize

extensions = [
    Extension(
        name="test_module",
        sources=["src/test/test.pyx"],
        extra_compile_args=["-O3"]
    )
]

setup(
    name="CythonTestModule",
    ext_modules=cythonize(extensions, annotate=True)
)
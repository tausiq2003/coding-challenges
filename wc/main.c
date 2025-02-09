#include <ctype.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void ccwc(const char *filename, const char *flag, FILE *fptr) {
    char ch;
    long long int cntc = 0;
    long long int cntl = 0;
    long long int cntw = 0;
    long long int cntm = 0;
    int in_word = 0;
    while ((ch = fgetc(fptr)) != EOF) {
        cntc++;
        if (ch == '\n') {
            cntl++;
        }
        if (!isspace(ch)) {
            if (in_word == 0) {
                in_word = 1;
                cntw++;
            }
        } else if (in_word) {
            in_word = 0;
        }

        if (ch > -64) {
            cntm++;
        }
    }
    if (!strcmp(flag, "-c")) {
        printf("%lld\t%s\n", cntc, filename);
    } else if (!strcmp(flag, "-l")) {

        printf("%lld\t%s\n", cntl, filename);
    } else if (!strcmp(flag, "-w")) {
        printf("%lld\t%s\n", cntw, filename);
    } else if (!strcmp(flag, "-m")) {

        printf("%lld\t%s\n", cntm, filename);
    } else if (!strcmp(flag, "")) {
        printf("%lld\t%lld\t%lld\t%s\n", cntl, cntw, cntc, filename);
    } else {
        perror("Error while reading files, please give appropriate file name");
        exit(1);
    }
}

int main(int argc, char *argv[]) {
    FILE *fptr = stdin;
    const char *filename = "";
    const char *flag = "";

    if (argc > 1) {
        if (!strcmp(argv[1], "-c") || !strcmp(argv[1], "-w") ||
            !strcmp(argv[1], "-l") || !strcmp(argv[1], "-m")) {
            flag = argv[1];
            if (argc > 2) {
                filename = argv[2];
            }
        } else {
            filename = argv[1];
        }
    }

    if (strcmp(filename, "") != 0) {
        fptr = fopen(filename, "r");
        if (!fptr) {
            perror("Error opening file");
            exit(1);
        }
    }

    ccwc(filename, flag, fptr);

    if (fptr != stdin) {
        fclose(fptr);
    }
    return 0;
}

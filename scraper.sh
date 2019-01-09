# Completely inspired by https://github.com/fercgomes
# All credits belongs to him
#
# Added by me:
#   > Optional parameters from the Command Line
#   > Handled the "<div class="asterisco">*</div>" string
#   > File saving
COURSE=${COURSE:="Ciência da Computação"};
YEAR=${YEAR:="2018"};
FILENAME="$COURSE.txt"

[ -e "$FILENAME" ] && rm "$FILENAME"
for i in {a..z}; do
	curl --silent https://www.ufrgs.br/vestibular/cv$YEAR/listao/arquivo_${i}.html | grep "$COURSE" -B 4 -A 1 | awk -F "</*td>|</*tr>" '/<\/*t[rd]>.*[A-Z]/ {print $2}' | sed -e "/^$COURSE/d" | sed 's/<div class="asterisco">\*<\/div>//g' >> "$FILENAME";
done

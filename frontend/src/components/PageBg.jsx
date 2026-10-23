const PageBg = ({ hideCharacter = false }) => {
    return (

        <div
            aria-hidden="true"
            className="fixed inset-0 -z-10 overflow-hidden bg-neutral-800 pointer-events-none"
        >
            {!hideCharacter && (
                <img src="https://puppiizsunniiz.github.io/Arknight-Images/characters/char_124_kroos_sale%2314_sp.png" alt="" draggable={false}
                    className="absolute -bottom-75 -left-64 w-4xl md:w-5xl select-none opacity-10"
                />
            )}
        </div>
    );
};

export default PageBg;
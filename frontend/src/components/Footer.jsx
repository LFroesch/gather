const Footer = () => {
	return (
		<footer className='hidden xl:block py-6 md:px-8 md:py-0 bg-base-300 border-t border-base-content/10'>
			<div className='flex flex-col h-full items-center justify-between gap-4 md:h-16 md:flex-row container mx-auto px-4'>
				<p className='text-sm text-base-content/60'>
					Gather
				</p>
				<div className='flex items-center gap-4 text-sm text-base-content/60'>
					<span>Built by{" "}
						<a
							href='https://froesch.dev'
							target='_blank'
							rel='noreferrer'
							className='font-medium hover:text-primary transition-colors'
						>
							Lucas Froeschner
						</a>
					</span>
					<span className='text-base-content/30'>|</span>
					<a
						href='https://github.com/LFroesch'
						target='_blank'
						rel='noreferrer'
						className='hover:text-primary transition-colors'
					>
						GitHub
					</a>
				</div>
			</div>
		</footer>
	);
};
export default Footer;